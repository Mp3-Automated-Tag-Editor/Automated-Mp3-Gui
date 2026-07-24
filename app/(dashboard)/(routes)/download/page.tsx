"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Download, Loader2, ScrollText, Square } from "lucide-react";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToastAction } from "@/components/ui/toast";
import { LibraryGate, useLibraryPath } from "@/components/library-gate";
import { useToast } from "@/components/ui/use-toast";
import { invalidateLibraryCache } from "@/app/(dashboard)/(routes)/edit/lib/library-cache";
import { cn } from "@/lib/utils";
import {
  DOWNLOAD,
  ROUTES,
  TAURI_COMMANDS,
  TAURI_EVENTS,
} from "@/constants";

type DownloadFinished = {
  success: boolean;
  code?: number | null;
  backend: string;
  message: string;
  failedCount?: number;
  failureLogPath?: string | null;
};

function detectBackend(url: string): typeof DOWNLOAD.backendSpotdl | typeof DOWNLOAD.backendYtdlp | null {
  const u = url.trim().toLowerCase();
  if (!u) return null;
  if (u.includes(DOWNLOAD.spotifyHost) || u.startsWith(DOWNLOAD.spotifyScheme)) {
    return DOWNLOAD.backendSpotdl;
  }
  return DOWNLOAD.backendYtdlp;
}

const DownloadMusic = () => {
  const router = useRouter();
  const libraryPath = useLibraryPath();
  const { toast } = useToast();

  const [bitRate, setBitRate] = useState<number>(DOWNLOAD.defaultBitrate);
  const [url, setUrl] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [logsOpen, setLogsOpen] = useState(true);
  const [running, setRunning] = useState(false);
  const [ffmpegOk, setFfmpegOk] = useState<boolean | null>(null);

  const backend = useMemo(() => detectBackend(url), [url]);

  useEffect(() => {
    invoke<{ ffmpeg: boolean }>(TAURI_COMMANDS.checkDownloadDeps)
      .then((r) => setFfmpegOk(!!r?.ffmpeg))
      .catch(() => setFfmpegOk(null));
  }, []);

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
        await listen<string>(TAURI_EVENTS.downloadProgress, (e) => {
          const line =
            typeof e.payload === "string"
              ? e.payload
              : String(e.payload ?? "");
          if (!line.trim()) return;
          setLogs((prev) => [line, ...prev].slice(0, DOWNLOAD.logCap));
        })
      );
      track(
        await listen<DownloadFinished>(TAURI_EVENTS.downloadFinished, (e) => {
          const r = e.payload;
          setRunning(false);
          const failed = r?.failedCount ?? 0;
          const failPath = r?.failureLogPath?.trim();
          if (r?.success) {
            invalidateLibraryCache();
            const description =
              failed > 0
                ? `${r.message}${
                    failPath ? ` Failure log: ${failPath}` : ""
                  }`
                : "New songs are in your library. Open Edit to review and tag them.";
            toast({
              title:
                failed > 0
                  ? `Download finished · ${failed} failed`
                  : "Download complete",
              description,
              action: (
                <ToastAction
                  altText="Open Edit"
                  onClick={() => router.push(ROUTES.edit)}
                >
                  Open Edit
                </ToastAction>
              ),
            });
          } else {
            toast({
              title: "Download failed",
              description: failPath
                ? `${r?.message || "See logs."} Failure log: ${failPath}`
                : r?.message || "See logs for details.",
              variant: "destructive",
            });
          }
        })
      );
    })();

    return () => {
      disposed = true;
      while (cleanups.length) cleanups.pop()?.();
    };
  }, [router, toast]);

  const startDownload = async () => {
    if (!libraryPath) return;
    if (!url.trim()) {
      toast({
        title: "No URL",
        description: "Paste a Spotify or YouTube URL to download.",
        variant: "destructive",
      });
      return;
    }
    if (ffmpegOk === false) {
      toast({
        title: "ffmpeg required",
        description:
          "Install ffmpeg and ensure it is on your PATH, then restart the app.",
        variant: "destructive",
      });
      return;
    }

    setLogs([
      `— Starting download (${backend === DOWNLOAD.backendSpotdl ? "spotDL" : "yt-dlp"}, ${bitRate} kbps)`,
    ]);
    setLogsOpen(true);
    setRunning(true);

    try {
      await invoke(TAURI_COMMANDS.downloadMusic, {
        path: libraryPath,
        url: url.trim(),
        bitrate: bitRate,
      });
    } catch (error) {
      setRunning(false);
      const msg = error instanceof Error ? error.message : String(error);
      setLogs((prev) => [`✗ ${msg}`, ...prev].slice(0, DOWNLOAD.logCap));
      toast({
        title: "Could not start download",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const stopDownload = async () => {
    try {
      await invoke(TAURI_COMMANDS.stopDownloadMusic);
      setLogs((prev) => [`— Stop requested`, ...prev].slice(0, DOWNLOAD.logCap));
    } catch {
      // ignore
    }
  };

  if (!libraryPath) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Heading
          title="Download"
          description="Set a library folder first — downloads land there for Edit and Music."
          icon={Download}
          iconColor="text-pink-700"
          otherProps="mb-8 shrink-0"
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 lg:px-8">
          <LibraryGate />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Heading
        title="Download"
        description="Spotify via spotDL · YouTube via yt-dlp · files go to your library folder"
        icon={Download}
        iconColor="text-pink-700"
        otherProps="mb-4 shrink-0"
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 lg:px-8">
        <div className={cn("flex gap-3", logsOpen && "items-stretch")}>
          <div className="min-w-0 flex-1 space-y-4 rounded-lg border p-4 md:p-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">How it works</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  Spotify links (track / album / playlist) use the bundled{" "}
                  <strong className="font-medium text-foreground">spotDL</strong>{" "}
                  sidecar (audio still comes from YouTube). Some YouTube sources
                  need <strong className="font-medium text-foreground">Deno</strong>
                  ; the app will try to install it via spotDL when missing.
                </li>
                <li>
                  YouTube and other links use bundled{" "}
                  <strong className="font-medium text-foreground">yt-dlp</strong>
                  , with title/artist/album defaults embedded when possible.
                </li>
                <li>
                  Files save into your library folder.{" "}
                  <strong className="font-medium text-foreground">ffmpeg</strong>{" "}
                  must be installed on PATH (not bundled).
                </li>
                <li>
                  Failed tracks are listed clearly in the logs and saved under{" "}
                  <strong className="font-medium text-foreground">
                    ~/.config/auto-mp3/download-logs/
                  </strong>{" "}
                  (artist, song, link, reason) — same app data folder as settings.
                </li>
              </ul>
            </div>

            {ffmpegOk === false ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                ffmpeg was not detected on PATH. Install it before downloading.
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="url">Spotify / YouTube URL</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://open.spotify.com/… or https://youtube.com/…"
                  disabled={running}
                  className="min-w-[200px] flex-1"
                />
                {backend ? (
                  <Badge variant="secondary">
                    {backend === DOWNLOAD.backendSpotdl ? "Spotify · spotDL" : "yt-dlp"}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bitrate (kbps)</Label>
              <div className="flex flex-wrap gap-2">
                {DOWNLOAD.bitrates.map((rate) => (
                  <Button
                    key={rate}
                    type="button"
                    variant={bitRate === rate ? "default" : "outline"}
                    className="h-9 w-14"
                    disabled={running}
                    onClick={() => setBitRate(rate)}
                  >
                    {rate}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Library folder</Label>
              <p className="break-all rounded-md bg-muted px-3 py-2 text-sm">
                {libraryPath}
              </p>
              <Button asChild variant="outline" size="sm" type="button">
                <Link href={ROUTES.settings}>Change in Settings</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                onClick={startDownload}
                disabled={running || !url.trim()}
              >
                {running ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading…
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Start download
                  </>
                )}
              </Button>
              {running ? (
                <Button type="button" variant="outline" onClick={stopDownload}>
                  <Square className="mr-2 h-3 w-3" />
                  Stop
                </Button>
              ) : null}
              <Button
                type="button"
                variant={logsOpen ? "secondary" : "outline"}
                onClick={() => setLogsOpen((v) => !v)}
              >
                <ScrollText className="mr-2 h-4 w-4" />
                Logs
              </Button>
            </div>
          </div>

          {logsOpen ? (
            <aside className="flex w-96 shrink-0 flex-col rounded-md border bg-card lg:w-[28rem] lg:h-[66vh] xl:w-[32rem] xl:h-[70vh]">
              <div className="border-b px-3 py-2 text-sm font-medium">
                Download logs
              </div>
              <ScrollArea className="flex-1 p-3">
                {logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No log lines yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5 font-mono text-[11px] leading-snug text-muted-foreground">
                    {logs.map((line, i) => (
                      <li key={`${i}-${line.slice(0, 32)}`}>{line}</li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DownloadMusic;
