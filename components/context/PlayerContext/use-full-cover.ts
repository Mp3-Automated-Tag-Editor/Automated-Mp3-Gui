"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { DEFAULT_COVER, TAURI_COMMANDS } from "@/constants";
import { coverDataUrl, trackCoverSrc } from "./music-utils";
import type { Track } from "./types";

/** In-memory full-resolution covers keyed by absolute MP3 path. */
const fullCoverCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

export function getCachedFullCover(path: string | null | undefined): string | null {
  if (!path) return null;
  return fullCoverCache.get(path) ?? null;
}

export function invalidateFullCover(path: string | null | undefined): void {
  if (!path) return;
  fullCoverCache.delete(path);
  inflight.delete(path);
}

/** Drop every cached full cover (e.g. after a full library reload). */
export function clearFullCoverCache(): void {
  fullCoverCache.clear();
  inflight.clear();
}

function toDataUrl(b64: string): string {
  const trimmed = b64.trim();
  if (!trimmed) return DEFAULT_COVER;
  if (trimmed.startsWith("data:")) return trimmed;
  return coverDataUrl(trimmed);
}

/**
 * Fetch original embedded cover for one file. Shared across Player Bar,
 * Now Playing, Edit sheet, and Media Session.
 */
export async function fetchFullCover(path: string): Promise<string> {
  const cached = fullCoverCache.get(path);
  if (cached) return cached;

  const existing = inflight.get(path);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const b64 = await invoke<string>(TAURI_COMMANDS.getTrackCover, { path });
      if (!b64 || !String(b64).trim()) {
        return DEFAULT_COVER;
      }
      const url = toDataUrl(String(b64));
      fullCoverCache.set(path, url);
      return url;
    } catch {
      return DEFAULT_COVER;
    } finally {
      inflight.delete(path);
    }
  })();

  inflight.set(path, promise);
  return promise;
}

export type FullCoverState = {
  /** Thumb first, then full once loaded (or DEFAULT_COVER). */
  src: string;
  loading: boolean;
  isFull: boolean;
};

/**
 * Lazily upgrades from list thumb → original APIC for the current track.
 * Safe to call from Player Bar + Now Playing simultaneously (shared cache).
 */
export function useFullCover(
  track: Track | null | undefined
): FullCoverState {
  const path = track?.path?.trim() || "";
  const thumb = trackCoverSrc(track);
  const cached = path ? fullCoverCache.get(path) : undefined;

  const [src, setSrc] = useState(() => cached || thumb);
  const [loading, setLoading] = useState(() => Boolean(path) && !cached);
  const [isFull, setIsFull] = useState(() => Boolean(cached));

  useEffect(() => {
    if (!path) {
      setSrc(DEFAULT_COVER);
      setLoading(false);
      setIsFull(false);
      return;
    }

    const hit = fullCoverCache.get(path);
    if (hit) {
      setSrc(hit);
      setLoading(false);
      setIsFull(true);
      return;
    }

    setSrc(thumb);
    setIsFull(false);
    setLoading(true);
    let cancelled = false;

    void fetchFullCover(path).then((url) => {
      if (cancelled) return;
      setSrc(url);
      setIsFull(url !== DEFAULT_COVER);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [path, thumb]);

  return { src, loading, isFull };
}
