import { DEFAULT_COVER, EMPTY_TAG } from "@/constants";
import type { AlbumGroup, ArtistGroup, Track } from "./types";

export { DEFAULT_COVER };

/** Infer data-URL mime from raw base64 (JPEG/PNG/GIF magic). */
export function coverDataUrl(base64: string): string {
  const b64 = base64.trim();
  if (!b64) return DEFAULT_COVER;
  let mime = "image/jpeg";
  if (b64.startsWith("/9j/") || b64.startsWith("/9j4")) mime = "image/jpeg";
  else if (b64.startsWith("iVBOR")) mime = "image/png";
  else if (b64.startsWith("R0lGOD")) mime = "image/gif";
  return `data:${mime};base64,${b64}`;
}

export function trackCoverSrc(track: Track | null | undefined): string {
  if (track?.imageSrc) {
    return coverDataUrl(track.imageSrc);
  }
  return DEFAULT_COVER;
}

export function displayTitle(track: Track): string {
  if (track.title && track.title !== EMPTY_TAG) return track.title;
  return track.file?.replace(/\.mp3$/i, "") || "Unknown Title";
}

export function displayArtist(track: Track): string {
  if (track.artist && track.artist !== EMPTY_TAG) return track.artist;
  return "Unknown Artist";
}

export function displayAlbum(track: Track): string {
  if (track.album && track.album !== EMPTY_TAG) return track.album;
  return "Unknown Album";
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function groupAlbums(tracks: Track[]): AlbumGroup[] {
  const map = new Map<string, AlbumGroup>();
  for (const track of tracks) {
    const name = displayAlbum(track);
    const artist = displayArtist(track);
    const key = `${name}::${artist}`.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.tracks.push(track);
      if (existing.cover === DEFAULT_COVER && track.imageSrc) {
        existing.cover = trackCoverSrc(track);
      }
    } else {
      map.set(key, {
        name,
        artist,
        cover: trackCoverSrc(track),
        tracks: [track],
      });
    }
  }
  return Array.from(map.values()).map((album) => ({
    ...album,
    tracks: [...album.tracks].sort(
      (a, b) => a.track - b.track || displayTitle(a).localeCompare(displayTitle(b))
    ),
  }));
}

export function groupArtists(tracks: Track[]): ArtistGroup[] {
  const map = new Map<string, Track[]>();
  for (const track of tracks) {
    const name = displayArtist(track);
    const list = map.get(name) ?? [];
    list.push(track);
    map.set(name, list);
  }
  return Array.from(map.entries())
    .map(([name, artistTracks]) => ({
      name,
      tracks: artistTracks,
      albums: groupAlbums(artistTracks),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
