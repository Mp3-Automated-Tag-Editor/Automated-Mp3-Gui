import { convertFileSrc } from "@tauri-apps/api/tauri";
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

/** True when imageSrc is a filesystem path (cover thumb), not base64. */
export function isCoverFilePath(imageSrc: string): boolean {
  const s = imageSrc.trim();
  if (!s || s === "has_cover") return false;
  if (s.startsWith("data:")) return false;
  // JPEG base64 magic is "/9j/…" — must not be treated as a Unix path.
  if (
    s.startsWith("/9j/") ||
    s.startsWith("/9j4") ||
    s.startsWith("iVBOR") ||
    s.startsWith("R0lGOD")
  ) {
    return false;
  }
  // Absolute paths / thumbnails written by the library indexer
  if (/^[a-zA-Z]:[\\/]/.test(s) || s.startsWith("\\\\") || s.startsWith("/")) {
    return true;
  }
  return s.toLowerCase().endsWith(".jpg") || s.toLowerCase().endsWith(".jpeg");
}

export function trackCoverSrc(track: Track | null | undefined): string {
  const src = track?.imageSrc?.trim();
  if (!src || src === "has_cover") return DEFAULT_COVER;
  if (src.startsWith("data:")) return src;
  if (isCoverFilePath(src)) {
    try {
      return convertFileSrc(src);
    } catch {
      return DEFAULT_COVER;
    }
  }
  return coverDataUrl(src);
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

/** Single-pass album grouping (no nested re-walk). */
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

/**
 * Single-pass artist + album grouping. Avoids calling groupAlbums per artist
 * (which previously re-scanned subsets and rebuilt cover URLs repeatedly).
 */
export function groupArtists(tracks: Track[]): ArtistGroup[] {
  const byArtist = new Map<string, Track[]>();
  for (const track of tracks) {
    const name = displayArtist(track);
    const list = byArtist.get(name) ?? [];
    list.push(track);
    byArtist.set(name, list);
  }

  const albums = groupAlbums(tracks);
  const albumsByArtist = new Map<string, AlbumGroup[]>();
  for (const album of albums) {
    const list = albumsByArtist.get(album.artist) ?? [];
    list.push(album);
    albumsByArtist.set(album.artist, list);
  }

  return Array.from(byArtist.entries())
    .map(([name, artistTracks]) => ({
      name,
      tracks: artistTracks,
      albums: albumsByArtist.get(name) ?? [],
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

/** Map Player Track → Edit Song shape (shared library store). */
export function trackToSongFields(track: Track) {
  return {
    id: track.id,
    file: track.file,
    artist: track.artist,
    title: track.title,
    album: track.album,
    path: track.path,
    albumArtist: track.albumArtist,
    year: track.year,
    track: track.track,
    genre: track.genre,
    comments: track.comments,
    composer: track.composer,
    discno: track.discno,
    imageSrc: track.imageSrc,
    percentage: track.percentage,
    status: track.status,
    sessionName: track.sessionName,
  };
}
