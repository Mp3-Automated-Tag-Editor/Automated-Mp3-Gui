"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayer } from "@/components/context/PlayerContext";
import type { Track } from "@/components/context/PlayerContext/types";
import {
  displayAlbum,
  displayArtist,
  displayTitle,
  trackCoverSrc,
} from "@/components/context/PlayerContext/music-utils";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

type SongListProps = {
  tracks: Track[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  /** When true, fills parent height instead of a fixed viewport calc */
  fillHeight?: boolean;
};

export function SongList({
  tracks,
  title,
  description,
  emptyMessage = "No songs yet. Add a music folder to get started.",
  fillHeight = true,
}: SongListProps) {
  const { playTrack, currentTrack, isPlaying, toggleLike, isLiked } = usePlayer();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) => {
      const hay =
        `${displayTitle(t)} ${displayArtist(t)} ${displayAlbum(t)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [tracks, query]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-3",
        fillHeight && "h-full"
      )}
    >
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          {title ? (
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>
        <Input
          placeholder="Search songs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full shrink-0 sm:max-w-xs md:max-w-sm"
        />
      </div>
      <div
        className={cn(
          "min-h-0 rounded-md border",
          fillHeight
            ? "flex-1"
            : "h-[min(28rem,calc(100dvh-18rem))] sm:h-[min(30rem,calc(100dvh-20rem))]"
        )}
      >
        <ScrollArea className="h-full">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground sm:p-6">{emptyMessage}</p>
          ) : (
            <div className="divide-y">
              {filtered.map((track) => {
                const active = currentTrack?.path === track.path;
                return (
                  <div
                    key={track.path}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 sm:gap-3 sm:px-3 sm:py-2 hover:bg-accent/60",
                      active && "bg-accent"
                    )}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left sm:gap-3"
                      onClick={() => playTrack(track, tracks)}
                    >
                      <Image
                        src={trackCoverSrc(track)}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="h-9 w-9 shrink-0 rounded object-cover sm:h-10 sm:w-10"
                      />
                      <span className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {displayTitle(track)}
                          {active && isPlaying ? " · Playing" : ""}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {displayArtist(track)} — {displayAlbum(track)}
                        </p>
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => toggleLike(track)}
                      title="Like"
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4",
                          isLiked(track.path) && "fill-red-500 text-red-500"
                        )}
                      />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
