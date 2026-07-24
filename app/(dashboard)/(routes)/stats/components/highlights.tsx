"use client";

import type { DecadeBucket, LibraryHighlights } from "../lib/types";
import { buildHighlightCards } from "@/constants";

type HighlightsProps = {
  highlights: LibraryHighlights;
  decades: DecadeBucket[];
};

export function Highlights({ highlights, decades }: HighlightsProps) {
  const cards = buildHighlightCards(highlights);
  const topDecade = [...decades].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Your highlights</h3>
        <p className="text-sm text-muted-foreground">
          Wrapped-style snapshots from this library
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border bg-gradient-to-br from-card to-muted/40 p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 line-clamp-2 text-xl font-bold tracking-tight">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </div>
      {topDecade ? (
        <p className="text-sm text-muted-foreground">
          Your strongest decade is{" "}
          <span className="font-semibold text-foreground">{topDecade.decade}</span>{" "}
          with {topDecade.count} tracks (
          {topDecade.percent.toFixed(0)}% of dated songs).
        </p>
      ) : null}
    </div>
  );
}
