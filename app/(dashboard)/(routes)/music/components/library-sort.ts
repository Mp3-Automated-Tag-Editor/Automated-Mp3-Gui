import type {
  AlbumGroup,
  ArtistGroup,
  Track,
} from "@/components/context/PlayerContext/types";
import {
  displayArtist,
  displayTitle,
} from "@/components/context/PlayerContext/music-utils";

export type AlbumSortKey =
  | "name-asc"
  | "name-desc"
  | "year-desc"
  | "year-asc";

export type ArtistSortKey = "name-asc" | "name-desc";

export type SongSortKey =
  | "title-asc"
  | "title-desc"
  | "artist-asc"
  | "year-desc"
  | "year-asc";

export function albumYear(album: AlbumGroup): number {
  let max = 0;
  for (const t of album.tracks) {
    if (t.year && t.year > max) max = t.year;
  }
  return max;
}

export function sortAlbums(
  list: AlbumGroup[],
  key: AlbumSortKey
): AlbumGroup[] {
  const sorted = [...list];
  switch (key) {
    case "name-asc":
      return sorted.sort(
        (a, b) =>
          a.name.localeCompare(b.name) || a.artist.localeCompare(b.artist)
      );
    case "name-desc":
      return sorted.sort(
        (a, b) =>
          b.name.localeCompare(a.name) || b.artist.localeCompare(a.artist)
      );
    case "year-desc":
      return sorted.sort(
        (a, b) =>
          albumYear(b) - albumYear(a) || a.name.localeCompare(b.name)
      );
    case "year-asc":
      return sorted.sort(
        (a, b) =>
          albumYear(a) - albumYear(b) || a.name.localeCompare(b.name)
      );
    default:
      return sorted;
  }
}

export function sortArtists(
  list: ArtistGroup[],
  key: ArtistSortKey
): ArtistGroup[] {
  const sorted = [...list];
  switch (key) {
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return sorted;
  }
}

export function sortSongs(list: Track[], key: SongSortKey): Track[] {
  const sorted = [...list];
  switch (key) {
    case "title-asc":
      return sorted.sort((a, b) =>
        displayTitle(a).localeCompare(displayTitle(b))
      );
    case "title-desc":
      return sorted.sort((a, b) =>
        displayTitle(b).localeCompare(displayTitle(a))
      );
    case "artist-asc":
      return sorted.sort(
        (a, b) =>
          displayArtist(a).localeCompare(displayArtist(b)) ||
          displayTitle(a).localeCompare(displayTitle(b))
      );
    case "year-desc":
      return sorted.sort(
        (a, b) =>
          (b.year || 0) - (a.year || 0) ||
          displayTitle(a).localeCompare(displayTitle(b))
      );
    case "year-asc":
      return sorted.sort(
        (a, b) =>
          (a.year || 0) - (b.year || 0) ||
          displayTitle(a).localeCompare(displayTitle(b))
      );
    default:
      return sorted;
  }
}

export const ALBUM_SORT_OPTIONS: { value: AlbumSortKey; label: string }[] = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "year-desc", label: "Newest first" },
  { value: "year-asc", label: "Oldest first" },
];

export const ARTIST_SORT_OPTIONS: { value: ArtistSortKey; label: string }[] = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
];

export const SONG_SORT_OPTIONS: { value: SongSortKey; label: string }[] = [
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "artist-asc", label: "Artist A–Z" },
  { value: "year-desc", label: "Newest first" },
  { value: "year-asc", label: "Oldest first" },
];
