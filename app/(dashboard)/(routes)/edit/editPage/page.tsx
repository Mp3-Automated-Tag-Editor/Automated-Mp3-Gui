"use client";

import { Pencil } from "lucide-react";
import { Heading } from "@/components/heading";
import { Song } from "../data/schema";
import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { useSearchParams, useRouter } from "next/navigation";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import {
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Loading from "@/components/loading";
import { LibraryGate, useLibraryPath } from "@/components/library-gate";
import { ConfigContext } from "@/components/context/ConfigContext";
import {
  clearPendingSuggestion,
  loadPendingSuggestions,
  type PendingSuggestion,
  upsertPendingSuggestion,
} from "../lib/pending-suggestions";
import { useToast } from "@/components/ui/use-toast";
import type { ScrapeProgressState } from "../components/data-table-toolbar";
import { usePlayer } from "@/components/context/PlayerContext";
import { trackToSongFields } from "@/components/context/PlayerContext/music-utils";
import {
  CONFIG_KEYS,
  INCOMPLETE_PERCENTAGE_MAX,
  QUERY,
  ROUTES,
  SCRAPE_MODE,
  type ScrapeMode,
  SONG_STATUS,
  STATS,
  TAURI_COMMANDS,
  TAURI_EVENTS,
} from "@/constants";

type ScrapeSongResult = {
  path: string;
  file: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  track: number;
  genre: string;
  comments: string;
  albumArtist: string;
  composer: string;
  discno: number;
  accuracy: number;
  applied: boolean;
  success: boolean;
  errorMessage: string;
};

const EditPage = () => {
  const libraryPath = useLibraryPath();
  const {
    tracks,
    isLoading: libraryLoading,
    isScanning,
    scanProgress,
    loadFolder,
    upsertTrackMetadata,
  } = usePlayer();

  // Shared library store — no independent full-directory IPC reload
  const songs: Song[] = useMemo(
    () => tracks.map((t) => trackToSongFields(t) as Song),
    [tracks]
  );

  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [pendingByPath, setPendingByPath] = useState<
    Record<string, PendingSuggestion>
  >({});
  const [scrapingPaths, setScrapingPaths] = useState<Set<string>>(new Set());
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgressState>({
    running: false,
    total: 0,
    done: 0,
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const { configs, addConfig } = useContext(ConfigContext);
  const { toast } = useToast();
  const incomplete = searchParams.get("filter") === QUERY.incompleteFilter;

  const [scrapeMode, setScrapeMode] = useState<ScrapeMode>(
    configs?.[CONFIG_KEYS.scrapeMode] === SCRAPE_MODE.apply
      ? SCRAPE_MODE.apply
      : SCRAPE_MODE.review
  );

  useEffect(() => {
    setScrapeMode(
      configs?.[CONFIG_KEYS.scrapeMode] === SCRAPE_MODE.apply
        ? SCRAPE_MODE.apply
        : SCRAPE_MODE.review
    );
  }, [configs?.[CONFIG_KEYS.scrapeMode]]);

  useEffect(() => {
    void loadPendingSuggestions().then(setPendingByPath);
  }, [libraryPath]);

  useEffect(() => {
    let disposed = false;
    const cleanups: Array<() => void> = [];

    const track = (unlisten: () => void) => {
      if (disposed) {
        unlisten();
        return;
      }
      cleanups.push(unlisten);
    };

    (async () => {
      track(
        await listen<{ songName?: string }>(TAURI_EVENTS.progressStart, (e) => {
          const name = e.payload?.songName || "song";
          setLogs((prev) =>
            [`▶ Scraping ${name}`, ...prev].slice(0, STATS.scrapeLogCap)
          );
        })
      );
      track(
        await listen<{ songName?: string }>(TAURI_EVENTS.progressEnd, (e) => {
          const name = e.payload?.songName || "song";
          setLogs((prev) =>
            [`✓ Done ${name}`, ...prev].slice(0, STATS.scrapeLogCap)
          );
          setScrapeProgress((p) => ({
            ...p,
            done: Math.min(p.done + 1, p.total || p.done + 1),
          }));
        })
      );
      track(
        await listen<ScrapeSongResult>(
          TAURI_EVENTS.scrapeSongResult,
          async (e) => {
            const r = e.payload;
            if (!r?.path) return;
            setScrapingPaths((prev) => {
              const next = new Set(prev);
              next.delete(r.path);
              return next;
            });
            if (!r.success) {
              setLogs((prev) =>
                [
                  `✗ ${r.file || r.path}: ${r.errorMessage || "failed"}`,
                  ...prev,
                ].slice(0, STATS.scrapeLogCap)
              );
              return;
            }
            if (r.applied) {
              upsertTrackMetadata({
                path: r.path,
                title: r.title,
                artist: r.artist,
                album: r.album,
                year: r.year,
                track: r.track,
                genre: r.genre,
                comments: r.comments,
                albumArtist: r.albumArtist,
                composer: r.composer,
                discno: r.discno,
                status: SONG_STATUS.edit,
              });
              try {
                const refreshed = await invoke<Record<string, unknown>>(
                  TAURI_COMMANDS.refreshLibraryTrack,
                  { path: r.path, directory: libraryPath }
                );
                if (refreshed?.path) {
                  upsertTrackMetadata(refreshed as any);
                }
              } catch {
                // in-memory patch above is enough for UI
              }
              setLogs((prev) =>
                [`✓ Applied: ${r.file}`, ...prev].slice(0, STATS.scrapeLogCap)
              );
            } else {
              const suggestion: PendingSuggestion = {
                path: r.path,
                file: r.file,
                title: r.title,
                artist: r.artist,
                album: r.album,
                year: r.year,
                track: r.track,
                genre: r.genre,
                comments: r.comments,
                albumArtist: r.albumArtist,
                composer: r.composer,
                discno: r.discno,
              };
              const map = await upsertPendingSuggestion(suggestion);
              setPendingByPath(map);
              setLogs((prev) =>
                [`⚑ Review saved: ${r.file}`, ...prev].slice(
                  0,
                  STATS.scrapeLogCap
                )
              );
            }
          }
        )
      );
      track(
        await listen(TAURI_EVENTS.scrapeResult, () => {
          setScrapeProgress((p) => ({ ...p, running: false }));
          setScrapingPaths(new Set());
          setLogs((prev) =>
            [`— Scrape batch finished`, ...prev].slice(0, STATS.scrapeLogCap)
          );
        })
      );
      track(
        await listen<{ errorMessage?: string }>(TAURI_EVENTS.errorEnv, (e) => {
          setLogs((prev) =>
            [
              `✗ Env/API: ${e.payload?.errorMessage || "error"}`,
              ...prev,
            ].slice(0, STATS.scrapeLogCap)
          );
        })
      );
    })();

    return () => {
      disposed = true;
      while (cleanups.length) cleanups.pop()?.();
    };
  }, [libraryPath, upsertTrackMetadata]);

  async function updateSong(
    filePath: string,
    updatedSong: Song,
    coverImagePath?: string | null
  ) {
    const toSave: Song = {
      ...updatedSong,
      status: SONG_STATUS.saved,
      sessionName: SONG_STATUS.saved,
    };
    const val: [boolean, string] = await invoke(TAURI_COMMANDS.updateMusicFile, {
      path: filePath,
      song: coverImagePath ? { ...toSave, imageSrc: "" } : toSave,
      coverImagePath: coverImagePath || null,
    });
    if (val[0] == false) {
      return val;
    }
    upsertTrackMetadata({
      path: toSave.path || filePath,
      title: toSave.title,
      artist: toSave.artist,
      album: toSave.album,
      year: toSave.year,
      track: toSave.track,
      genre: toSave.genre,
      comments: toSave.comments,
      albumArtist: toSave.albumArtist,
      composer: toSave.composer,
      discno: toSave.discno,
      imageSrc: toSave.imageSrc,
      status: toSave.status,
      sessionName: toSave.sessionName,
      percentage: toSave.percentage,
    });
    try {
      const refreshed = await invoke<Record<string, unknown>>(
        TAURI_COMMANDS.refreshLibraryTrack,
        {
          path: toSave.path || filePath,
          directory: libraryPath,
        }
      );
      if (refreshed?.path) {
        upsertTrackMetadata(refreshed as any);
      }
    } catch {
      // ignore
    }
    const map = await clearPendingSuggestion(toSave.path || filePath);
    setPendingByPath(map);
    return val;
  }

  function syncSongLocal(filePath: string, updatedSong: Song) {
    upsertTrackMetadata({
      ...updatedSong,
      path: updatedSong.path || filePath,
    });
  }

  async function dismissPending(path: string) {
    const map = await clearPendingSuggestion(path);
    setPendingByPath(map);
  }

  const onStartScrape = async (selectedPaths: string[]) => {
    if (!libraryPath) return;
    let paths = selectedPaths;
    if (paths.length === 0) {
      paths = songs
        .filter((s) => s.percentage <= INCOMPLETE_PERCENTAGE_MAX)
        .map((s) => s.path);
    }
    if (paths.length === 0) {
      toast({
        title: "Nothing to scrape",
        description: `No selected songs and no tracks at ≤${INCOMPLETE_PERCENTAGE_MAX}% completion.`,
      });
      return;
    }

    setLogs((prev) =>
      [
        `— Starting scrape (${paths.length} songs, mode=${scrapeMode})`,
        ...prev,
      ].slice(0, STATS.scrapeLogCap)
    );
    setScrapeProgress({ running: true, total: paths.length, done: 0 });
    setScrapingPaths(new Set(paths));
    setLogsOpen(true);

    try {
      await invoke(TAURI_COMMANDS.scrapeLibraryPaths, {
        paths,
        apply: scrapeMode === SCRAPE_MODE.apply,
      });
    } catch (e: unknown) {
      setScrapeProgress((p) => ({ ...p, running: false }));
      setScrapingPaths(new Set());
      toast({
        title: "Scrape failed to start",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const onStopScrape = async () => {
    try {
      await invoke(TAURI_COMMANDS.stopScrapeProcess);
      setLogs((prev) =>
        [`— Stop requested`, ...prev].slice(0, STATS.scrapeLogCap)
      );
    } catch {
      // ignore
    }
  };

  const onScrapeModeChange = (mode: ScrapeMode) => {
    setScrapeMode(mode);
    addConfig(configs, { key: CONFIG_KEYS.scrapeMode, value: mode });
  };

  if (!libraryPath) {
    return (
      <div>
        <Heading
          title="Edit Music Files"
          description="Set a library folder to start editing tags"
          icon={Pencil}
          iconColor="text-orange-700"
          otherProps="mb-8"
        />
        <div className="px-4 lg:px-8">
          <LibraryGate
            onReady={(path) => {
              router.replace(
                incomplete
                  ? `${ROUTES.editPage}?filter=${QUERY.incompleteFilter}`
                  : ROUTES.editPage
              );
              void loadFolder(path);
            }}
          />
        </div>
      </div>
    );
  }

  const showBlockingLoad =
    libraryLoading && songs.length === 0 && !isScanning;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {showBlockingLoad ? (
        <Loading msg="Loading your Music Database..." />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Heading
            title="Edit Music Files"
            description={`Library: ${libraryPath}${
              incomplete
                ? ` · showing ≤${INCOMPLETE_PERCENTAGE_MAX}% complete`
                : ""
            }${
              isScanning && scanProgress
                ? ` · indexing ${scanProgress.done}/${
                    scanProgress.total || "…"
                  }`
                : ""
            }`}
            icon={Pencil}
            iconColor="text-orange-700"
            otherProps="mb-4 shrink-0"
          />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 lg:px-8">
            <DataTable
              directory={libraryPath}
              functions={{ updateSong, dismissPending, syncSongLocal }}
              data={songs}
              columns={columns}
              totalSongs={songs.length}
              scrapeProgress={scrapeProgress}
              logs={logs}
              logsOpen={logsOpen}
              onToggleLogs={() => setLogsOpen((v) => !v)}
              onStartScrape={onStartScrape}
              onStopScrape={onStopScrape}
              scrapeMode={scrapeMode}
              onScrapeModeChange={onScrapeModeChange}
              pendingByPath={pendingByPath}
              scrapingPaths={scrapingPaths}
              defaultIncompleteFilter={incomplete}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function EditPageRoute() {
  return (
    <Suspense fallback={null}>
      <EditPage />
    </Suspense>
  );
}
