"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { formatTime } from "@/components/context/PlayerContext/music-utils";

type PlayerSeekBarProps = {
  value: number;
  max: number;
  disabled?: boolean;
  onSeek: (time: number) => void;
  className?: string;
};

export function PlayerSeekBar({
  value,
  max,
  disabled,
  onSeek,
  className,
}: PlayerSeekBarProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = React.useState(false);
  const [hoverRatio, setHoverRatio] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  const safeMax = max > 0 ? max : 100;
  const playedRatio = Math.min(1, Math.max(0, value / safeMax));
  const showChrome = (hovering || dragging) && !disabled;
  const hoverTime = hoverRatio * (max > 0 ? max : 0);

  const previewStart = Math.min(playedRatio, hoverRatio);
  const previewEnd = Math.max(playedRatio, hoverRatio);

  const updateHover = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setHoverRatio(ratio);
  };

  return (
    <div
      className={cn("group relative min-w-0 flex-1 py-1", className)}
      onPointerEnter={() => !disabled && setHovering(true)}
      onPointerLeave={() => {
        if (!dragging) setHovering(false);
      }}
      onPointerMove={(e) => {
        if (!disabled) updateHover(e.clientX);
      }}
    >
      {showChrome && max > 0 && (
        <div
          className="pointer-events-none absolute -top-6 z-10 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-background shadow-sm"
          style={{ left: `${hoverRatio * 100}%` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      <div ref={trackRef} className="relative w-full">
        <SliderPrimitive.Root
          value={[Number.isFinite(value) ? value : 0]}
          max={safeMax}
          step={0.1}
          disabled={disabled}
          onValueChange={(v) => onSeek(v[0] ?? 0)}
          onValueCommit={() => {
            setDragging(false);
          }}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          className="relative flex w-full touch-none select-none items-center"
        >
          <SliderPrimitive.Track
            className={cn(
              "relative h-1 w-full grow overflow-hidden rounded-full bg-secondary transition-[height]",
              showChrome && "h-1.5 bg-muted-foreground/40"
            )}
          >
            <SliderPrimitive.Range
              className={cn(
                "absolute h-full bg-foreground/70 transition-colors",
                showChrome && "bg-foreground"
              )}
            />
            {/* Scrub preview between playhead and hover point */}
            {showChrome && previewEnd > previewStart && (
              <div
                className="pointer-events-none absolute top-0 h-full bg-foreground/35"
                style={{
                  left: `${previewStart * 100}%`,
                  width: `${(previewEnd - previewStart) * 100}%`,
                }}
              />
            )}
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className={cn(
              "block h-3 w-3 rounded-full border-0 bg-foreground shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
              showChrome ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
            aria-label="Seek"
          />
        </SliderPrimitive.Root>
      </div>
    </div>
  );
}

type PlayerVolumeBarProps = {
  value: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
};

export function PlayerVolumeBar({
  value,
  onVolumeChange,
  className,
}: PlayerVolumeBarProps) {
  const [hovering, setHovering] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const showChrome = hovering || dragging;

  return (
    <div
      className={cn("group py-1", className)}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => {
        if (!dragging) setHovering(false);
      }}
    >
      <SliderPrimitive.Root
        value={[value]}
        max={1}
        step={0.01}
        onValueChange={(v) => onVolumeChange(v[0] ?? 0)}
        onValueCommit={() => setDragging(false)}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        className="relative flex w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track
          className={cn(
            "relative h-1 w-full grow overflow-hidden rounded-full bg-secondary transition-[height]",
            showChrome && "h-1.5 bg-muted-foreground/40"
          )}
        >
          <SliderPrimitive.Range
            className={cn(
              "absolute h-full bg-foreground/70 transition-colors",
              showChrome && "bg-foreground"
            )}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block h-3 w-3 rounded-full border-0 bg-foreground shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            showChrome ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
          aria-label="Volume"
        />
      </SliderPrimitive.Root>
    </div>
  );
}
