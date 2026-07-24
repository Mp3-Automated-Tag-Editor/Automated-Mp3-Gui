"use client";

import type { NamedCount } from "../lib/types";
import { GENRE_PIE_PALETTE } from "@/constants";

type GenrePieProps = {
  data: NamedCount[];
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export function GenrePie({ data }: GenrePieProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (!total) {
    return (
      <p className="text-sm text-muted-foreground">No genre data yet.</p>
    );
  }

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 96;
  const innerR = 54;

  let angle = 0;
  const slices = data.map((item, i) => {
    const sweep = (item.count / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    // Full circle edge case
    if (data.length === 1) {
      return {
        ...item,
        color: GENRE_PIE_PALETTE[i % GENRE_PIE_PALETTE.length],
        path: undefined as string | undefined,
        full: true,
      };
    }
    return {
      ...item,
      color: GENRE_PIE_PALETTE[i % GENRE_PIE_PALETTE.length],
      path: describeSlice(cx, cy, r, start, end),
      full: false,
    };
  });

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((slice) =>
            slice.full ? (
              <circle
                key={slice.name}
                cx={cx}
                cy={cy}
                r={r}
                fill={slice.color}
              />
            ) : (
              <path
                key={slice.name}
                d={slice.path}
                fill={slice.color}
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
            )
          )}
          <circle cx={cx} cy={cy} r={innerR} fill="hsl(var(--card))" />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            className="fill-foreground text-[22px] font-bold"
          >
            {data.length}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            genres
          </text>
        </svg>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2">
        {slices.map((slice) => (
          <li
            key={slice.name}
            className="flex items-center gap-3 text-sm"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate font-medium">
              {slice.name}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {slice.count}
            </span>
            <span className="w-14 text-right tabular-nums text-muted-foreground">
              {slice.percent.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
