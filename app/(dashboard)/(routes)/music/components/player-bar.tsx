"use client";

import Image from "next/image";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayer } from "@/components/context/PlayerContext";
import {
  displayArtist,
  displayTitle,
  formatTime,
  trackCoverSrc,
} from "@/components/context/PlayerContext/music-utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type PlayerBarProps = {
  onOpenPlayer?: () => void;
};

export function PlayerBar({ onOpenPlayer }: PlayerBarProps) {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    queue,
    currentIndex,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    playTrack,
    toggleLike,
    isLiked,
  } = usePlayer();

  const cover = trackCoverSrc(currentTrack);
  const title = currentTrack ? displayTitle(currentTrack) : "No track selected";
  const artist = currentTrack
    ? displayArtist(currentTrack)
    : "Add music to get started";
  const liked = currentTrack ? isLiked(currentTrack.path) : false;

  return (
    <div className="z-50 w-full shrink-0 border-t border-white/20 bg-background/70 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/55 dark:border-white/10 dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-3 py-2 sm:px-4 sm:py-3 lg:flex-row lg:items-center lg:gap-4">
        {/* Track info — click opens Music Player tab */}
        <button
          type="button"
          className="flex min-w-0 items-center gap-3 rounded-md text-left transition-colors hover:bg-accent/50 lg:w-[28%] lg:max-w-xs"
          onClick={onOpenPlayer}
          title="Open Music Player"
        >
          <Image
            src={cover}
            alt={title}
            width={56}
            height={56}
            className="h-12 w-12 shrink-0 rounded object-cover sm:h-14 sm:w-14"
            unoptimized
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{artist}</p>
          </div>
        </button>

        {/* Transport + seek */}
        <div
          className="flex min-w-0 flex-1 flex-col items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", shuffle && "text-primary")}
              onClick={toggleShuffle}
              title="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={prev}
              disabled={!currentTrack}
              title="Previous"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={next}
              disabled={!currentTrack}
              title="Next"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", repeat !== "off" && "text-primary")}
              onClick={cycleRepeat}
              title={`Repeat: ${repeat}`}
            >
              {repeat === "one" ? (
                <Repeat1 className="h-4 w-4" />
              ) : (
                <Repeat className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2">
            <span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
              {formatTime(position)}
            </span>
            <Slider
              value={[Number.isFinite(position) ? position : 0]}
              max={duration > 0 ? duration : 100}
              step={0.1}
              disabled={!currentTrack}
              onValueChange={(v) => seek(v[0] ?? 0)}
              className="min-w-0 flex-1"
            />
            <span className="w-10 shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Queue + volume */}
        <div
          className="flex items-center justify-end gap-2 lg:w-[22%] lg:min-w-[10rem]"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!currentTrack}
            onClick={() => currentTrack && toggleLike(currentTrack)}
            title={liked ? "Unlike" : "Like"}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                liked && "fill-red-500 text-red-500"
              )}
            />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Queue">
                <ListMusic className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[min(20rem,calc(100vw-2rem))] p-0"
            >
              <div className="border-b px-3 py-2 text-sm font-medium">
                Up Next ({queue.length})
              </div>
              <ScrollArea className="h-64">
                <div className="p-1">
                  {queue.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">
                      Queue is empty
                    </p>
                  ) : (
                    queue.map((track, i) => (
                      <button
                        key={`${track.path}-${i}`}
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent",
                          i === currentIndex && "bg-accent"
                        )}
                        onClick={() => playTrack(track, queue)}
                      >
                        <Image
                          src={trackCoverSrc(track)}
                          alt=""
                          width={32}
                          height={32}
                          unoptimized
                          className="h-8 w-8 shrink-0 rounded object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {displayTitle(track)}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {displayArtist(track)}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleMute}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[muted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={(v) => setVolume(v[0] ?? 0)}
            className="w-20 sm:w-24"
          />
        </div>
      </div>
    </div>
  );
}
