"use client";

import Image from "next/image";
import type { NamedCount } from "../lib/types";
import { cn } from "@/lib/utils";
import { DEFAULT_COVER } from "@/constants";

type WrappedListProps = {
  title: string;
  subtitle?: string;
  items: NamedCount[];
  showCovers?: boolean;
  barMax?: number;
};

export function WrappedList({
  title,
  subtitle,
  items,
  showCovers = false,
  barMax,
}: WrappedListProps) {
  const max = barMax ?? items[0]?.count ?? 1;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {subtitle ? (
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nothing to show yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((item, i) => (
            <li key={item.name} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              {showCovers ? (
                <Image
                  src={item.cover || DEFAULT_COVER}
                  alt=""
                  width={36}
                  height={36}
                  unoptimized
                  className="h-9 w-9 shrink-0 rounded object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {item.count} · {item.percent.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full bg-primary/80")}
                    style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
