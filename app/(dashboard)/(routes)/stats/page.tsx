"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { BarChartHorizontalIcon } from "lucide-react";

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/context/PlayerContext";
import { useToast } from "@/components/ui/use-toast";

import { withCovers } from "./lib/aggregate";
import type {
  CountryBucket,
  DecadeBucket,
  LibraryHighlights,
  LibraryStatsPayload,
  LibrarySummary,
  LibraryTimelineItem,
  NamedCount,
} from "./lib/types";
import { useArtistCountries } from "./lib/use-artist-countries";
import { StatCard } from "./components/stat-card";
import { GenrePie } from "./components/genre-pie";
import { WrappedList } from "./components/wrapped-list";
import { Highlights } from "./components/highlights";
import { DecadeSection } from "./components/decade-section";
import { LibraryTimeline } from "./components/library-timeline";

import { LibraryGate, useLibraryPath } from "@/components/library-gate";
import { ConfigContext } from "@/components/context/ConfigContext";
import { useContext } from "react";
import { CONFIG_KEYS, ROUTES, STATS, TAURI_COMMANDS } from "@/constants";

const WorldMap = dynamic(
  () => import("./components/world-map").then((m) => m.WorldMap),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
        Loading map…
      </div>
    ),
  }
);

const emptySummary: LibrarySummary = {
  songs: 0,
  artists: 0,
  albums: 0,
  genres: 0,
  liked: 0,
  yearMin: null,
  yearMax: null,
};

const emptyHighlights: LibraryHighlights = {
  topArtist: null,
  topArtistCount: 0,
  dominantGenre: null,
  dominantGenreCount: 0,
  oldestYear: null,
  newestYear: null,
  likedCount: 0,
  recentTitle: null,
  recentArtist: null,
};

const StatsPage = () => {
  const {
    tracks,
    likedPaths,
    recentlyPlayed,
    isLoading,
    loadFolder,
  } = usePlayer();
  const { toast } = useToast();
  const { configs, addConfig } = useContext(ConfigContext);
  const libraryPath = useLibraryPath();
  const { artistIso, pending, resolving, unknownArtists } =
    useArtistCountries(tracks);

  const [summary, setSummary] = useState<LibrarySummary>(emptySummary);
  const [genres, setGenres] = useState<NamedCount[]>([]);
  const [artists, setArtists] = useState<NamedCount[]>([]);
  const [decades, setDecades] = useState<DecadeBucket[]>([]);
  const [highlights, setHighlights] =
    useState<LibraryHighlights>(emptyHighlights);
  const [timelineItems, setTimelineItems] = useState<LibraryTimelineItem[]>(
    []
  );
  const [buckets, setBuckets] = useState<CountryBucket[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const tracksKey = useMemo(
    () =>
      tracks
        .map(
          (t) =>
            `${t.path}|${t.artist}|${t.album}|${t.year}|${t.genre}|${t.title}`
        )
        .join("\n"),
    [tracks]
  );
  const likedKey = likedPaths.join("\0");
  const recentKey = recentlyPlayed.join("\0");
  const countryKey = useMemo(
    () =>
      Object.entries(artistIso)
        .map(([k, v]) => `${k}=${v ?? ""}`)
        .sort()
        .join("|"),
    [artistIso]
  );

  useEffect(() => {
    let cancelled = false;
    if (tracks.length === 0) {
      setSummary(emptySummary);
      setGenres([]);
      setArtists([]);
      setDecades([]);
      setHighlights(emptyHighlights);
      setTimelineItems([]);
      setBuckets([]);
      return;
    }

    (async () => {
      setStatsLoading(true);
      try {
        const inputTracks = tracks.map((t) => ({
          path: t.path,
          file: t.file,
          artist: t.artist,
          title: t.title,
          album: t.album,
          year: t.year,
          genre: t.genre,
        }));
        const payload = await invoke<LibraryStatsPayload>(
          TAURI_COMMANDS.computeLibraryStats,
          {
            input: {
              tracks: inputTracks,
              likedPaths,
              recentlyPlayed,
              artistCountry: artistIso,
            },
          }
        );
        if (cancelled) return;
        const enriched = withCovers(payload, tracks);
        setSummary(payload.summary);
        setGenres(enriched.genres);
        setArtists(enriched.artists);
        setDecades(payload.decades);
        setHighlights(payload.highlights);
        setTimelineItems(enriched.timeline);
        setBuckets(enriched.countries);
      } catch (e: unknown) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : String(e);
          toast({
            title: "Stats failed",
            description: message,
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracksKey, likedKey, recentKey, countryKey]);

  const topCountry = buckets[0] ?? null;

  const handleAddMusic = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select a music folder",
      });
      if (!selected || Array.isArray(selected)) return;
      await addConfig(configs, { key: CONFIG_KEYS.libraryPath, value: selected });
      await loadFolder(selected);
      toast({
        title: "Library loaded",
        description: selected,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      toast({
        title: "Could not open folder",
        description: message,
        variant: "destructive",
      });
    }
  };

  const empty = !isLoading && tracks.length === 0;
  const yearSpan =
    summary.yearMin != null && summary.yearMax != null
      ? summary.yearMin === summary.yearMax
        ? String(summary.yearMin)
        : `${summary.yearMin}–${summary.yearMax}`
      : "—";

  const dominantGenre = genres.find((g) => g.name !== "Other") ?? genres[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Heading
        title="Statistics"
        description="Your Music Stats all in one place :)"
        icon={BarChartHorizontalIcon}
        iconColor="text-yellow-700"
        otherProps="mb-4 shrink-0"
      />

      <div className="relative min-h-0 flex-1">
        <div className="scroll-edge-blur" aria-hidden />
        <div className="h-full min-h-0 space-y-8 overflow-y-auto px-4 pb-8 pt-4 lg:px-8">
        {isLoading || (statsLoading && tracks.length > 0 && summary.songs === 0) ? (
          <p className="py-12 text-sm text-muted-foreground">
            Loading library…
          </p>
        ) : !libraryPath && empty ? (
          <LibraryGate />
        ) : empty ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-8">
            <h3 className="text-lg font-semibold">No library stats yet</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Load a music folder to see genre breakdowns, your timeline, a
              world map of artist origins, and more. You can also open{" "}
              <Link
                href={ROUTES.music}
                className="font-medium text-foreground underline underline-offset-4"
              >
                Music Playstation
              </Link>{" "}
              and choose Add music.
            </p>
            <Button onClick={handleAddMusic}>
              <PlusCircledIcon className="mr-2 h-4 w-4" />
              Add music
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="grid gap-3 md:grid-cols-3">
              <StatCard
                label="Library"
                value={
                  <span className="tabular-nums">{summary.songs} songs</span>
                }
                hint={`${summary.artists} artists · ${summary.albums} albums · ${summary.liked} liked`}
              />
              <StatCard
                label="Genres"
                value={
                  <span className="tabular-nums text-violet-600 dark:text-violet-400">
                    {summary.genres} genres
                  </span>
                }
                hint={
                  dominantGenre ? (
                    <>
                      The genre dominating your library is{" "}
                      <span className="font-medium text-violet-600 dark:text-violet-400">
                        {dominantGenre.name}
                      </span>
                      <span className="mt-0.5 block">
                        from {dominantGenre.count} tracks
                      </span>
                    </>
                  ) : (
                    "No genre tags yet"
                  )
                }
              />
              <StatCard
                label="Countries"
                value={
                  <span className="tabular-nums text-amber-600 dark:text-amber-400">
                    {buckets.length} countries
                  </span>
                }
                hint={
                  topCountry ? (
                    <>
                      You have more music from{" "}
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {topCountry.name}
                      </span>{" "}
                      than any other country
                      <span className="mt-0.5 block">
                        from {topCountry.trackCount} tracks
                      </span>
                    </>
                  ) : resolving ? (
                    `Resolving artist countries… (${pending} left)`
                  ) : (
                    "Artist countries resolve via MusicBrainz"
                  )
                }
              />
            </section>

            <LibraryTimeline
              items={timelineItems}
              yearMin={summary.yearMin}
              yearMax={summary.yearMax}
            />

            <WorldMap
              buckets={buckets}
              resolving={resolving}
              pending={pending}
              unknownArtists={unknownArtists}
            />

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Songs" value={summary.songs} />
              <StatCard label="Artists" value={summary.artists} />
              <StatCard label="Albums" value={summary.albums} />
              <StatCard
                label="Years"
                value={yearSpan}
                hint={
                  summary.yearMin != null
                    ? "From tagged release years"
                    : "No years in tags"
                }
              />
            </section>

            <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
              <h3 className="text-lg font-semibold tracking-tight">
                Genre mix
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Share of your library by tagged genre
              </p>
              <GenrePie data={genres} />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <WrappedList
                title="Top artists"
                subtitle="Ranked by track count in this library"
                items={artists}
                showCovers
              />
              <WrappedList
                title="Top genres"
                subtitle="Same mix as the chart, ranked"
                items={genres.filter((g) => g.name !== "Other").slice(0, STATS.genreLimit)}
              />
            </section>

            <DecadeSection decades={decades} />

            <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
              <Highlights highlights={highlights} decades={decades} />
            </section>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
