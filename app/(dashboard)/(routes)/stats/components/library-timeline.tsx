"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { LibraryTimelineItem } from "../lib/types";

type LibraryTimelineProps = {
  items: LibraryTimelineItem[];
  yearMin: number | null;
  yearMax: number | null;
  maxStack?: number;
};

export function LibraryTimeline({
  items,
  yearMin,
  yearMax,
  maxStack = 7,
}: LibraryTimelineProps) {
  const byYear = useMemo(() => {
    const map = new Map<number, LibraryTimelineItem[]>();
    for (const item of items) {
      const list = map.get(item.year) ?? [];
      list.push(item);
      map.set(item.year, list);
    }
    return map;
  }, [items]);

  if (yearMin == null || yearMax == null || items.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-semibold tracking-tight">
          Your library timeline
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No release years found in tags yet.
        </p>
      </div>
    );
  }

  const span = Math.max(1, yearMax - yearMin);
  const decades: number[] = [];
  const startDecade = Math.floor(yearMin / 10) * 10;
  const endDecade = Math.floor(yearMax / 10) * 10;
  for (let y = startDecade; y <= endDecade; y += 10) {
    decades.push(y);
  }

  const years = Array.from(byYear.keys()).sort((a, b) => a - b);

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <h3 className="text-lg font-semibold tracking-tight">
        Your library spans {span} year{span === 1 ? "" : "s"}
      </h3>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Album art placed by release year
      </p>

      <div className="mt-6 overflow-x-auto pb-2">
        <div
          className="relative mx-auto"
          style={{ minWidth: Math.max(640, span * 14 + 80) }}
        >
          {/* Stacked covers */}
          <div className="relative mb-2 h-[168px]">
            {years.map((year) => {
              const list = byYear.get(year) ?? [];
              const visible = list.slice(0, maxStack);
              const overflow = list.length - visible.length;
              const leftPct =
                span === 0 ? 50 : ((year - yearMin) / span) * 100;

              return (
                <div
                  key={year}
                  className="absolute bottom-0 flex flex-col-reverse items-center"
                  style={{
                    left: `${leftPct}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {overflow > 0 ? (
                    <span className="mb-0.5 rounded-full bg-muted px-1.5 text-[9px] font-medium tabular-nums text-muted-foreground">
                      +{overflow}
                    </span>
                  ) : null}
                  {visible.map((item, i) => (
                    <Image
                      key={`${item.year}-${item.album}-${item.artist}-${i}`}
                      src={item.cover}
                      alt=""
                      width={28}
                      height={28}
                      unoptimized
                      title={`${item.year} · ${item.album} — ${item.artist}`}
                      className="relative -mb-1 h-7 w-7 rounded-full object-cover ring-2 ring-card"
                      style={{ zIndex: visible.length - i }}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Axis */}
          <div className="relative h-px bg-border" />
          <div className="relative mt-2 h-5">
            {decades.map((d) => {
              const leftPct =
                span === 0 ? 50 : ((d - yearMin) / span) * 100;
              if (leftPct < -2 || leftPct > 102) return null;
              return (
                <span
                  key={d}
                  className="absolute text-[11px] tabular-nums text-muted-foreground"
                  style={{
                    left: `${leftPct}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {d}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
