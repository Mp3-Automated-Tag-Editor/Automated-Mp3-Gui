"use client";

import { cn } from "@/lib/utils";

type MiniEqProps = {
  playing?: boolean;
  className?: string;
};

const BARS = [
  { delay: "0ms", duration: "0.45s" },
  { delay: "80ms", duration: "0.55s" },
  { delay: "40ms", duration: "0.4s" },
  { delay: "120ms", duration: "0.5s" },
  { delay: "60ms", duration: "0.48s" },
];

export function MiniEq({ playing = false, className }: MiniEqProps) {
  return (
    <div
      className={cn("flex h-3 items-end gap-[2px]", className)}
      aria-hidden
    >
      {BARS.map((bar, i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full",
            playing ? "mini-eq-bar" : "mini-eq-bar-idle h-1"
          )}
          style={
            playing
              ? {
                  animationDelay: bar.delay,
                  animationDuration: bar.duration,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
