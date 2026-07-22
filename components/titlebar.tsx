"use client";

import { useEffect, useState } from "react";
import type { WebviewWindow } from "@tauri-apps/api/window";
import Image from "next/image";
import ModeToggle from "./context/theme-button";
import { Minus, Pause, Play, SkipBack, SkipForward, Square, X } from "lucide-react";
import { usePlayer } from "@/components/context/PlayerContext";
import {
  displayArtist,
  displayTitle,
  trackCoverSrc,
} from "@/components/context/PlayerContext/music-utils";
import { MiniEq } from "@/components/mini-eq";
import { extractDominantColors } from "@/app/(dashboard)/(routes)/music/lib/dominant-color";
import { cn } from "@/lib/utils";

/** Soften album colors so the pill gradient isn’t overly vivid. */
function muteColor(rgbStr: string, amount = 0.22): string {
  const match = rgbStr.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i);
  if (!match) return rgbStr;
  let r = Number(match[1]);
  let g = Number(match[2]);
  let b = Number(match[3]);
  // Light pull toward muted slate + slight darken
  const targetR = 71;
  const targetG = 85;
  const targetB = 105;
  r = r * (1 - amount) + targetR * amount;
  g = g * (1 - amount) + targetG * amount;
  b = b * (1 - amount) + targetB * amount;
  r *= 0.9;
  g *= 0.9;
  b *= 0.9;
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export default function TitleBar({
  titleBar: _titleBar = "",
}: {
  titleBar?: string;
}) {
  const [appWindow, setAppWindow] = useState<WebviewWindow>();
  const { currentTrack, isPlaying, togglePlay, next, prev } = usePlayer();
  const [artColors, setArtColors] = useState<[string, string]>([
    "rgb(226, 232, 240)",
    "rgb(241, 245, 249)",
  ]);

  const cover = trackCoverSrc(currentTrack);

  useEffect(() => {
    (async () => {
      const { appWindow: win } = await import("@tauri-apps/api/window");
      setAppWindow(win);
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    extractDominantColors(cover).then((colors) => {
      if (!cancelled) setArtColors(colors);
    });
    return () => {
      cancelled = true;
    };
  }, [cover, currentTrack?.path]);

  const title = currentTrack ? displayTitle(currentTrack) : "Nothing playing";
  const artist = currentTrack ? displayArtist(currentTrack) : "";
  const hasTrack = Boolean(currentTrack);

  const mutedPrimary = muteColor(artColors[0], 0.22);
  const mutedSecondary = muteColor(artColors[1], 0.26);

  return (
    <div className="titlebar">
      <div className="titlebar-drag" data-tauri-drag-region />

      <div
        className={cn("titlebar-pill", hasTrack && "titlebar-pill-playing")}
        style={
          hasTrack
            ? {
                background: `linear-gradient(90deg, ${mutedSecondary} 0%, ${mutedPrimary} 58%, ${mutedPrimary} 100%)`,
                borderColor: "transparent",
                color: "#fff",
              }
            : undefined
        }
      >
        <div className="titlebar-pill-left">
          {hasTrack ? (
            <span className="titlebar-now-playing titlebar-song-title" title={title}>
              {title}
            </span>
          ) : (
            <span className="titlebar-brand">Auto-Mp3</span>
          )}
        </div>

        <div className="titlebar-pill-center">
          <div className="titlebar-transport">
            <button
              type="button"
              className="titlebar-pill-btn"
              onClick={prev}
              title="Previous"
              disabled={!currentTrack}
            >
              <SkipBack size={11} />
            </button>
            <button
              type="button"
              className="titlebar-pill-btn titlebar-pill-btn-play"
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={11} className="fill-current" />
              ) : (
                <Play size={11} className="fill-current" />
              )}
            </button>
            <button
              type="button"
              className="titlebar-pill-btn"
              onClick={next}
              title="Next"
              disabled={!currentTrack}
            >
              <SkipForward size={11} />
            </button>
          </div>
          <MiniEq playing={isPlaying} className="ml-0.5" />
        </div>

        <div className="titlebar-pill-meta">
          {hasTrack ? (
            <>
              <div className="titlebar-meta-text">
                <span className="titlebar-meta-artist" title={artist}>
                  {artist}
                </span>
              </div>
              <Image
                src={cover}
                alt=""
                width={22}
                height={22}
                unoptimized
                className="titlebar-pill-art"
              />
            </>
          ) : (
            <span className="titlebar-idle-label">Nothing playing</span>
          )}
        </div>
      </div>

      <div className="titlebar-actions">
        <ModeToggle />
        <button
          type="button"
          className="titlebar-button"
          onClick={() => appWindow?.minimize()}
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          className="titlebar-button"
          onClick={() => appWindow?.toggleMaximize()}
          title="Maximize"
        >
          <Square size={14} />
        </button>
        <button
          type="button"
          className="titlebar-button titlebar-button-close"
          onClick={() => appWindow?.close()}
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
