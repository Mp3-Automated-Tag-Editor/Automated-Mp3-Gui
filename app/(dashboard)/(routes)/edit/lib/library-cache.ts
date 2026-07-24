/** Shared Edit library cache — survives route remounts; clear after downloads. */

import type { Song } from "../data/schema";
import type { PendingSuggestion } from "./pending-suggestions";

export type LibraryCache = {
  directory: string;
  songs: Song[];
  pending: Record<string, PendingSuggestion>;
};

let libraryCache: LibraryCache | null = null;

export function getLibraryCache(): LibraryCache | null {
  return libraryCache;
}

export function setLibraryCache(cache: LibraryCache | null): void {
  libraryCache = cache;
}

export function invalidateLibraryCache(): void {
  libraryCache = null;
}
