"use client";

import { Pencil } from "lucide-react";
import { Heading } from "@/components/heading";
import { z } from "zod";
import { songSchema, Song } from "../data/schema";
import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { useSearchParams, useRouter } from "next/navigation";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
import {
  getLibraryCache,
  setLibraryCache,
} from "../lib/library-cache";
import { useToast } from "@/components/ui/use-toast";
import type { ScrapeProgressState } from "../components/data-table-toolbar";
import { usePlayer } from "@/components/context/PlayerContext";
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

const fetchSongs = async (directory: string) => {
  try {
    const songs = await invoke(TAURI_COMMANDS.readMusicDirectory, { directory });
    return z.array(songSchema).parse(songs);
  } catch (error) {
    console.error("Failed to fetch Songs:", error);
    return [];
  }
};

const EditPage = () => {
  const libraryPath = useLibraryPath();
  const libraryCache = getLibraryCache();
  const cached =
    libraryPath && libraryCache?.directory === libraryPath
      ? libraryCache
      : null;

  const [songs, setSongs] = useState<Song[]>(cached?.songs ?? []);
  const [loading, setLoading] = useState(!cached);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [pendingByPath, setPendingByPath] = useState<
    Record<string, PendingSuggestion>
  >(cached?.pending ?? {});
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
  const { upsertTrackMetadata } = usePlayer();
  const incomplete = searchParams.get("filter") === QUERY.incompleteFilter;

  const [scrapeMode, setScrapeMode] = useState<ScrapeMode>(
    configs?.[CONFIG_KEYS.scrapeMode] === SCRAPE_MODE.apply
      ? SCRAPE_MODE.apply
      : SCRAPE_MODE.review
  );

  const loadRef = useRef<
    (dir: string, opts?: { silent?: boolean }) => Promise<void>
  >(async () => {});

  useEffect(() => {
    setScrapeMode(
      configs?.[CONFIG_KEYS.scrapeMode] === SCRAPE_MODE.apply
        ? SCRAPE_MODE.apply
        : SCRAPE_MODE.review
    );
  }, [configs?.[CONFIG_KEYS.scrapeMode]]);

  const load = useCallback(async (dir: string, opts?: { silent?: boolean }) => {
    const cache = getLibraryCache();
    const hasCache = cache?.directory === dir && cache.songs.length > 0;
    const silent = opts?.silent === true || hasCache;

    if (hasCache && cache) {
      setSongs(cache.songs);
      setPendingByPath(cache.pending);
      setLoading(false);
    } else if (!silent) {
      setLoading(true);
    }

    const fetched = await fetchSongs(dir);
    const pending = await loadPendingSuggestions();
    setLibraryCache({ directory: dir, songs: fetched, pending });
    setSongs(fetched);
    setPendingByPath(pending);
    setLoading(false);
  }, []);

  loadRef.current = load;

  useEffect(() => {
    if (!libraryPath) return;
    load(libraryPath, {
      silent: getLibraryCache()?.directory === libraryPath,
    });
  }, [libraryPath, load]);

  // Listen once — avoid duplicate handlers from remount / async cleanup races.
  useEffect(() => {
    let disposed = false;
    const cleanups: Array<() => void> = [];

    const track = (unlisten: () => void) => {
      if (disposed) {
        unlisten();
        return;
      }
      cleanups.push(unlisten);
      if (disposed) {
        while (cleanups.length) cleanups.pop()?.();
      }
    };

    (async () => {
      track(
        await listen<{ songName?: string }>(TAURI_EVENTS.progressStart, (e) => {
          const name = e.payload?.songName || "song";
          setLogs((prev) => [`▶ Scraping ${name}`, ...prev].slice(0, STATS.scrapeLogCap));
        })
      );
      track(
        await listen<{ songName?: string }>(TAURI_EVENTS.progressEnd, (e) => {
          const name = e.payload?.songName || "song";
          setLogs((prev) => [`✓ Done ${name}`, ...prev].slice(0, STATS.scrapeLogCap));
          setScrapeProgress((p) => ({
            ...p,
            done: Math.min(p.total, p.done + 1),
          }));
        })
      );
      track(
        await listen<ScrapeSongResult>(TAURI_EVENTS.scrapeSongResult, async (e) => {
          const r = e.payload;
          if (!r?.path) return;
          setScrapingPaths((prev) => {
            const next = new Set(prev);
            next.delete(r.path);
            return next;
          });
          if (!r.success) {
            setLogs((prev) =>
              [`✗ ${r.file}: ${r.errorMessage || "failed"}`, ...prev].slice(
                0,
                STATS.scrapeLogCap
              )
            );
            return;
          }
          if (r.applied) {
            setSongs((prev) => {
              const next = prev.map((s) =>
                s.path === r.path
                  ? {
                      ...s,
                      title: r.title || s.title,
                      artist: r.artist || s.artist,
                      album: r.album || s.album,
                      year: r.year || s.year,
                      track: r.track || s.track,
                      genre: r.genre || s.genre,
                      comments: r.comments || s.comments,
                      albumArtist: r.albumArtist || s.albumArtist,
                      composer: r.composer || s.composer,
                      discno: r.discno || s.discno,
                      status: SONG_STATUS.saved,
                      sessionName: SONG_STATUS.saved,
                    }
                  : s
              );
              if (getLibraryCache()) {
                setLibraryCache({ ...getLibraryCache()!, songs: next });
              }
              return next;
            });
            setLogs((prev) =>
              [`✓ Applied tags: ${r.file}`, ...prev].slice(0, STATS.scrapeLogCap)
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
            if (getLibraryCache()) {
              setLibraryCache({ ...getLibraryCache()!, pending: map });
            }
            setLogs((prev) =>
              [`⚑ Review saved: ${r.file}`, ...prev].slice(0, STATS.scrapeLogCap)
            );
          }
        })
      );
      track(
        await listen(TAURI_EVENTS.scrapeResult, () => {
          setScrapeProgress((p) => ({ ...p, running: false }));
          setScrapingPaths(new Set());
          setLogs((prev) =>
            [`— Scrape batch finished`, ...prev].slice(0, STATS.scrapeLogCap)
          );
          // Background refresh only — keep the table visible
          const dir = getLibraryCache()?.directory;
          if (dir) void loadRef.current(dir, { silent: true });
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
  }, []);

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
    setSongs((prevSongs) => {
      const next = prevSongs.map((song) =>
        song.path === toSave.path || song.path === filePath
          ? { ...song, ...toSave }
          : song
      );
      if (getLibraryCache()) {
        setLibraryCache({ ...getLibraryCache()!, songs: next });
      }
      return next;
    });
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
    });
    const map = await clearPendingSuggestion(toSave.path || filePath);
    setPendingByPath(map);
    if (getLibraryCache()) {
      setLibraryCache({ ...getLibraryCache()!, pending: map });
    }
    return val;
  }

  function syncSongLocal(filePath: string, updatedSong: Song) {
    setSongs((prevSongs) => {
      const next = prevSongs.map((song) =>
        song.path === updatedSong.path || song.path === filePath
          ? { ...song, ...updatedSong }
          : song
      );
      if (getLibraryCache()) {
        setLibraryCache({ ...getLibraryCache()!, songs: next });
      }
      return next;
    });
    upsertTrackMetadata({
      ...updatedSong,
      path: updatedSong.path || filePath,
    });
  }

  async function dismissPending(path: string) {
    const map = await clearPendingSuggestion(path);
    setPendingByPath(map);
    if (getLibraryCache()) {
      setLibraryCache({ ...getLibraryCache()!, pending: map });
    }
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
      setLogs((prev) => [`— Stop requested`, ...prev].slice(0, STATS.scrapeLogCap));
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
              load(path);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {loading && songs.length === 0 ? (
        <Loading msg="Loading your Music Database..." />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Heading
            title="Edit Music Files"
            description={`Library: ${libraryPath}${
              incomplete
                ? ` · showing ≤${INCOMPLETE_PERCENTAGE_MAX}% complete`
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
