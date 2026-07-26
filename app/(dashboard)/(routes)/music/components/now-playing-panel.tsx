"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePlayer } from "@/components/context/PlayerContext";
import {
  displayArtist,
  displayTitle,
  trackCoverSrc,
} from "@/components/context/PlayerContext/music-utils";
import { useFullCover } from "@/components/context/PlayerContext/use-full-cover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { extractDominantColors } from "../lib/dominant-color";

type NowPlayingPanelProps = {
  filterQuery?: string;
};

export function NowPlayingPanel({ filterQuery = "" }: NowPlayingPanelProps) {
  const { currentTrack, queue, currentIndex, playTrack, isPlaying } =
    usePlayer();
  const { src: cover, isFull } = useFullCover(currentTrack);
  const thumb = trackCoverSrc(currentTrack);
  // Cheap color extract from thumb; upgrade to full once available
  const colorSrc = isFull ? cover : thumb;
  const artActive = Boolean(currentTrack);
  const [colors, setColors] = useState<[string, string] | null>(null);

  useEffect(() => {
    if (!artActive) {
      setColors(null);
      return;
    }
    let cancelled = false;
    extractDominantColors(colorSrc).then((next) => {
      if (!cancelled) setColors(next);
    });
    return () => {
      cancelled = true;
    };
  }, [colorSrc, currentTrack?.path, artActive]);

  const q = filterQuery.trim().toLowerCase();
  const visibleQueue = q
    ? queue
        .map((track, i) => ({ track, i }))
        .filter(({ track }) => {
          const hay =
            `${displayTitle(track)} ${displayArtist(track)}`.toLowerCase();
          return hay.includes(q);
        })
    : queue.map((track, i) => ({ track, i }));

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-lg shadow-lg transition-[background,color] duration-700 sm:rounded-xl",
        artActive
          ? "text-white"
          : "border bg-background text-foreground"
      )}
      style={
        artActive && colors
          ? {
              background: `linear-gradient(160deg, ${colors[0]} 0%, ${colors[1]} 55%, rgb(8, 8, 10) 100%)`,
            }
          : undefined
      }
    >
      {artActive && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
      )}
      <div className="relative grid min-h-0 flex-1 gap-4 overflow-y-auto p-3 sm:gap-6 sm:p-4 md:p-6 lg:grid-cols-2 lg:overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
          <Image
            src={cover}
            alt={currentTrack ? displayTitle(currentTrack) : "No track"}
            width={320}
            height={320}
            unoptimized
            className={cn(
              "aspect-square w-full max-w-[min(100%,14rem)] rounded-lg object-cover shadow-2xl sm:max-w-[min(100%,18rem)] md:max-w-sm",
              artActive ? "ring-1 ring-white/10" : "ring-1 ring-border"
            )}
          />
          <div className="max-w-full px-2 text-center">
            <h3
              className={cn(
                "truncate text-lg font-semibold sm:text-xl",
                artActive && "drop-shadow"
              )}
            >
              {currentTrack ? displayTitle(currentTrack) : "Nothing playing"}
            </h3>
            <p
              className={cn(
                "truncate text-sm sm:text-base",
                artActive ? "text-white/75" : "text-muted-foreground"
              )}
            >
              {currentTrack
                ? displayArtist(currentTrack)
                : "Pick a song to start"}
            </p>
            {isPlaying && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  artActive ? "text-white/90" : "text-foreground"
                )}
              >
                Now playing
              </p>
            )}
          </div>
        </div>
        <div className="flex min-h-0 flex-col lg:h-full">
          <h3
            className={cn(
              "mb-2 shrink-0 text-base font-semibold sm:text-lg",
              artActive && "drop-shadow"
            )}
          >
            Queue
          </h3>
          <ScrollArea
            className={cn(
              "h-[min(16rem,35dvh)] min-h-[10rem] flex-1 rounded-md border backdrop-blur-sm sm:h-[min(20rem,40dvh)] lg:h-auto lg:min-h-0",
              artActive
                ? "border-white/10 bg-black/25"
                : "border-border bg-muted/40"
            )}
          >
            {visibleQueue.length === 0 ? (
              <p
                className={cn(
                  "p-4 text-sm",
                  artActive ? "text-white/60" : "text-muted-foreground"
                )}
              >
                {queue.length === 0 ? "Queue is empty" : "No matching tracks"}
              </p>
            ) : (
              <div
                className={cn(
                  "divide-y",
                  artActive ? "divide-white/10" : "divide-border"
                )}
              >
                {visibleQueue.map(({ track, i }) => (
                  <button
                    key={`${track.path}-${i}`}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 px-2 py-1.5 text-left sm:gap-3 sm:px-3 sm:py-2",
                      artActive
                        ? "hover:bg-white/10"
                        : "hover:bg-accent/60",
                      i === currentIndex &&
                        (artActive ? "bg-white/15" : "bg-accent")
                    )}
                    onClick={() => playTrack(track, queue)}
                  >
                    <Image
                      src={trackCoverSrc(track)}
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                      className="h-8 w-8 shrink-0 rounded object-cover sm:h-9 sm:w-9"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {i + 1}. {displayTitle(track)}
                      </span>
                      <span
                        className={cn(
                          "block truncate text-xs",
                          artActive
                            ? "text-white/65"
                            : "text-muted-foreground"
                        )}
                      >
                        {displayArtist(track)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
