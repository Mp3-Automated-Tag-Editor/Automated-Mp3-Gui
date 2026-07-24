import type { Track } from "@/components/context/PlayerContext/types";
import { trackCoverSrc } from "@/components/context/PlayerContext/music-utils";
import { DEFAULT_COVER } from "@/constants";
import type {
  CountryBucket,
  LibraryStatsPayload,
  LibraryTimelineItem,
  NamedCount,
} from "./types";

export type {
  CountryBucket,
  DecadeBucket,
  LibraryHighlights,
  LibrarySummary,
  LibraryTimelineItem,
  NamedCount,
  LibraryStatsPayload,
} from "./types";

/** Join Rust sample paths to local track covers for display. */
export function withCovers(
  payload: LibraryStatsPayload,
  tracks: Track[]
): {
  genres: NamedCount[];
  artists: NamedCount[];
  timeline: LibraryTimelineItem[];
  countries: CountryBucket[];
} {
  const byPath = new Map(tracks.map((t) => [t.path, t]));
  const coverFor = (path?: string | null) => {
    if (!path) return undefined;
    const t = byPath.get(path);
    return t ? trackCoverSrc(t) : undefined;
  };

  const genres: NamedCount[] = payload.genres.map((g) => ({
    name: g.name,
    count: g.count,
    percent: g.percent,
    samplePath: g.samplePath,
    cover: coverFor(g.samplePath),
  }));

  const artists: NamedCount[] = payload.artists.map((a) => ({
    name: a.name,
    count: a.count,
    percent: a.percent,
    samplePath: a.samplePath,
    cover: coverFor(a.samplePath),
  }));

  const timeline: LibraryTimelineItem[] = payload.timeline.map((item) => ({
    ...item,
    cover: coverFor(item.path) ?? DEFAULT_COVER,
  }));

  const countries: CountryBucket[] = payload.countries.map((c) => ({
    iso2: c.iso2,
    name: c.name,
    numericId: c.numericId,
    trackCount: c.trackCount,
    artistCount: c.artistCount,
    artists: c.artists,
    samplePaths: c.samplePaths,
    covers: c.samplePaths
      .map((p) => coverFor(p))
      .filter((x): x is string => !!x),
  }));

  return { genres, artists, timeline, countries };
}
