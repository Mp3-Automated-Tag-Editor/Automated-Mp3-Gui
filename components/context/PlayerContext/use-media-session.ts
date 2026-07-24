"use client";

import { useEffect, useRef } from "react";
import {
  displayAlbum,
  displayArtist,
  displayTitle,
  trackCoverSrc,
} from "./music-utils";
import type { Track } from "./types";

type MediaSessionHandlers = {
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  getPosition: () => number;
  getDuration: () => number;
};

function artworkForTrack(track: Track): MediaImage[] {
  const src = trackCoverSrc(track);
  if (!src) return [];

  let type = "image/png";
  if (src.startsWith("data:")) {
    const match = /^data:([^;,]+)/.exec(src);
    if (match?.[1]) type = match[1];
  } else if (/\.jpe?g$/i.test(src) || src.includes("image/jpeg")) {
    type = "image/jpeg";
  }

  return [
    { src, sizes: "96x96", type },
    { src, sizes: "256x256", type },
    { src, sizes: "512x512", type },
  ];
}

/**
 * Bridges the in-app player to the OS media session (Windows taskbar /
 * media flyout, lock screen, hardware media keys via WebView2).
 */
export function useMediaSession(
  currentTrack: Track | null,
  isPlaying: boolean,
  position: number,
  duration: number,
  handlers: MediaSessionHandlers
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const ms = navigator.mediaSession;
    const h = () => handlersRef.current;

    ms.setActionHandler("play", () => h().play());
    ms.setActionHandler("pause", () => h().pause());
    ms.setActionHandler("previoustrack", () => h().prev());
    ms.setActionHandler("nexttrack", () => h().next());
    ms.setActionHandler("seekto", (details) => {
      if (typeof details.seekTime === "number") {
        h().seek(details.seekTime);
      }
    });
    ms.setActionHandler("seekbackward", (details) => {
      const offset = details.seekOffset ?? 10;
      h().seek(Math.max(0, h().getPosition() - offset));
    });
    ms.setActionHandler("seekforward", (details) => {
      const offset = details.seekOffset ?? 10;
      const dur = h().getDuration();
      const max = Number.isFinite(dur) && dur > 0 ? dur : h().getPosition() + offset;
      h().seek(Math.min(max, h().getPosition() + offset));
    });
    ms.setActionHandler("stop", () => h().pause());

    return () => {
      ms.setActionHandler("play", null);
      ms.setActionHandler("pause", null);
      ms.setActionHandler("previoustrack", null);
      ms.setActionHandler("nexttrack", null);
      ms.setActionHandler("seekto", null);
      ms.setActionHandler("seekbackward", null);
      ms.setActionHandler("seekforward", null);
      ms.setActionHandler("stop", null);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    if (!currentTrack) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      return;
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: displayTitle(currentTrack),
        artist: displayArtist(currentTrack),
        album: displayAlbum(currentTrack),
        artwork: artworkForTrack(currentTrack),
      });
    } catch {
      // MediaMetadata / artwork may reject invalid sources
      navigator.mediaSession.metadata = new MediaMetadata({
        title: displayTitle(currentTrack),
        artist: displayArtist(currentTrack),
        album: displayAlbum(currentTrack),
      });
    }
  }, [currentTrack]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    if (!currentTrack) {
      navigator.mediaSession.playbackState = "none";
      return;
    }
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator) ||
      typeof navigator.mediaSession.setPositionState !== "function"
    ) {
      return;
    }
    if (!currentTrack || !Number.isFinite(duration) || duration <= 0) {
      return;
    }

    const clamped = Math.min(Math.max(0, position), duration);
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: clamped,
      });
    } catch {
      // Ignored when position/duration briefly disagree during track changes
    }
  }, [position, duration, currentTrack, isPlaying]);
}
