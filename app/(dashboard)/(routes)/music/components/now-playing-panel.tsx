"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePlayer } from "@/components/context/PlayerContext";
import {
  displayArtist,
  displayTitle,
  trackCoverSrc,
} from "@/components/context/PlayerContext/music-utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { extractDominantColors } from "../lib/dominant-color";

export function NowPlayingPanel() {
  const { currentTrack, queue, currentIndex, playTrack, isPlaying } = usePlayer();
  const cover = trackCoverSrc(currentTrack);
  const [colors, setColors] = useState<[string, string]>([
    "rgb(30, 30, 36)",
    "rgb(12, 12, 16)",
  ]);

  useEffect(() => {
    let cancelled = false;
    extractDominantColors(cover).then((next) => {
      if (!cancelled) setColors(next);
    });
    return () => {
      cancelled = true;
    };
  }, [cover, currentTrack?.path]);

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-lg text-white shadow-lg transition-[background] duration-700 sm:rounded-xl"
      style={{
        background: `linear-gradient(160deg, ${colors[0]} 0%, ${colors[1]} 55%, rgb(8, 8, 10) 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
      <div className="relative grid min-h-0 flex-1 gap-4 overflow-y-auto p-3 sm:gap-6 sm:p-4 md:p-6 lg:grid-cols-2 lg:overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
          <Image
            src={cover}
            alt={currentTrack ? displayTitle(currentTrack) : "No track"}
            width={320}
            height={320}
            unoptimized
            className="aspect-square w-full max-w-[min(100%,14rem)] rounded-lg object-cover shadow-2xl ring-1 ring-white/10 sm:max-w-[min(100%,18rem)] md:max-w-sm"
          />
          <div className="max-w-full px-2 text-center">
            <h3 className="truncate text-lg font-semibold drop-shadow sm:text-xl">
              {currentTrack ? displayTitle(currentTrack) : "Nothing playing"}
            </h3>
            <p className="truncate text-sm text-white/75 sm:text-base">
              {currentTrack
                ? displayArtist(currentTrack)
                : "Pick a song to start"}
            </p>
            {isPlaying && (
              <p className="mt-1 text-xs font-medium text-white/90">
                Now playing
              </p>
            )}
          </div>
        </div>
        <div className="flex min-h-0 flex-col lg:h-full">
          <h3 className="mb-2 shrink-0 text-base font-semibold drop-shadow sm:text-lg">
            Queue
          </h3>
          <ScrollArea className="h-[min(16rem,35dvh)] min-h-[10rem] flex-1 rounded-md border border-white/10 bg-black/25 backdrop-blur-sm sm:h-[min(20rem,40dvh)] lg:h-auto lg:min-h-0">
            {queue.length === 0 ? (
              <p className="p-4 text-sm text-white/60">Queue is empty</p>
            ) : (
              <div className="divide-y divide-white/10">
                {queue.map((track, i) => (
                  <button
                    key={`${track.path}-${i}`}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-white/10 sm:gap-3 sm:px-3 sm:py-2",
                      i === currentIndex && "bg-white/15"
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
                      <span className="block truncate text-xs text-white/65">
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
