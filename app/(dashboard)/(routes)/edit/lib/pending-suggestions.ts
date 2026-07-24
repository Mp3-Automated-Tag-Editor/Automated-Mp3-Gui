"use client";

import { Store } from "tauri-plugin-store-api";
import { STORE_FILE, STORE_KEYS } from "@/constants";

export type PendingSuggestion = {
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
};

const store = new Store(STORE_FILE);

export async function loadPendingSuggestions(): Promise<
  Record<string, PendingSuggestion>
> {
  try {
    await store.load();
    const data = (await store.get(STORE_KEYS.pendingSuggestions)) as Record<
      string,
      PendingSuggestion
    > | null;
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export async function savePendingSuggestions(
  map: Record<string, PendingSuggestion>
): Promise<void> {
  try {
    await store.load();
    await store.set(STORE_KEYS.pendingSuggestions, map);
    await store.save();
  } catch {
    // ignore
  }
}

export async function upsertPendingSuggestion(
  suggestion: PendingSuggestion
): Promise<Record<string, PendingSuggestion>> {
  const map = await loadPendingSuggestions();
  map[suggestion.path] = suggestion;
  await savePendingSuggestions(map);
  return map;
}

export async function clearPendingSuggestion(
  path: string
): Promise<Record<string, PendingSuggestion>> {
  const map = await loadPendingSuggestions();
  delete map[path];
  await savePendingSuggestions(map);
  return map;
}
