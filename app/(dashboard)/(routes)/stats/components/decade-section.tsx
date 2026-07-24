"use client";

import type { DecadeBucket } from "../lib/types";

type DecadeSectionProps = {
  decades: DecadeBucket[];
};

export function DecadeSection({ decades }: DecadeSectionProps) {
  const max = decades.length
    ? Math.max(...decades.map((d) => d.count))
    : 1;

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Decades</h3>
        <p className="text-sm text-muted-foreground">
          How your library spreads across time
        </p>
      </div>

      {decades.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No release years found in tags yet.
        </p>
      ) : (
        <div className="space-y-2">
          {decades.map((d) => (
            <div key={d.decade} className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-sm font-medium tabular-nums">
                {d.decade}
              </span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-500/80 dark:bg-amber-400/70"
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {d.count} · {d.percent.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
