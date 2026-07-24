/** UI-facing stats types (covers attached on the frontend after Rust aggregation). */

export type NamedCount = {
  name: string;
  count: number;
  percent: number;
  cover?: string;
  samplePath?: string | null;
};

export type DecadeBucket = {
  decade: string;
  count: number;
  percent: number;
};

export type LibrarySummary = {
  songs: number;
  artists: number;
  albums: number;
  genres: number;
  liked: number;
  yearMin: number | null;
  yearMax: number | null;
};

export type LibraryHighlights = {
  topArtist: string | null;
  topArtistCount: number;
  dominantGenre: string | null;
  dominantGenreCount: number;
  oldestYear: number | null;
  newestYear: number | null;
  likedCount: number;
  recentTitle: string | null;
  recentArtist: string | null;
};

export type LibraryTimelineItem = {
  year: number;
  path: string;
  cover: string;
  title: string;
  album: string;
  artist: string;
};

export type CountryBucket = {
  iso2: string;
  name: string;
  numericId?: string | null;
  trackCount: number;
  artistCount: number;
  artists: string[];
  covers: string[];
  samplePaths?: string[];
};

/** Raw payload from `compute_library_stats` (no covers). */
export type LibraryStatsPayload = {
  summary: LibrarySummary;
  genres: Array<{
    name: string;
    count: number;
    percent: number;
    samplePath?: string | null;
  }>;
  artists: Array<{
    name: string;
    count: number;
    percent: number;
    samplePath?: string | null;
  }>;
  decades: DecadeBucket[];
  highlights: LibraryHighlights;
  timeline: Array<{
    year: number;
    path: string;
    title: string;
    album: string;
    artist: string;
  }>;
  countries: Array<{
    iso2: string;
    name: string;
    numericId?: string | null;
    trackCount: number;
    artistCount: number;
    artists: string[];
    samplePaths: string[];
  }>;
};
