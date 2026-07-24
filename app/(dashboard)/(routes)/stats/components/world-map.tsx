"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import type { CountryBucket } from "../lib/types";
import { cn } from "@/lib/utils";
import {
  GEO,
  STATS_MAP_PALETTE_DARK,
  STATS_MAP_PALETTE_LIGHT,
  type StatsMapPalette,
} from "@/constants";

const COUNTRIES_TOPOJSON = GEO.countriesTopojson;

type WorldMapProps = {
  buckets: CountryBucket[];
  resolving?: boolean;
  pending?: number;
  unknownArtists?: number;
};

function fillForCount(
  count: number | undefined,
  max: number,
  selected: boolean,
  palette: StatsMapPalette
): string {
  if (selected) return palette.selected;
  if (!count || count <= 0) return palette.empty;
  const t = Math.min(1, count / Math.max(max, 1));
  const idx = Math.min(
    palette.heat.length - 1,
    Math.floor(t * palette.heat.length)
  );
  return palette.heat[idx];
}

export function WorldMap({
  buckets,
  resolving = false,
  pending = 0,
  unknownArtists = 0,
}: WorldMapProps) {
  const { resolvedTheme } = useTheme();
  const palette =
    resolvedTheme === "dark" ? STATS_MAP_PALETTE_DARK : STATS_MAP_PALETTE_LIGHT;

  const byIso = useMemo(() => {
    const m = new Map<string, CountryBucket>();
    for (const b of buckets) m.set(b.iso2.toUpperCase(), b);
    return m;
  }, [buckets]);

  const byNumeric = useMemo(() => {
    const m = new Map<string, CountryBucket>();
    for (const b of buckets) {
      const num = b.numericId;
      if (num) {
        m.set(String(Number(num)), b);
        m.set(num, b);
      }
    }
    return m;
  }, [buckets]);

  const maxCount = buckets[0]?.trackCount ?? 1;
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    bucket: CountryBucket;
  } | null>(null);

  useEffect(() => {
    if (!selectedIso && buckets[0]) {
      setSelectedIso(buckets[0].iso2);
    }
  }, [buckets, selectedIso]);

  const selected = selectedIso
    ? byIso.get(selectedIso.toUpperCase()) ?? null
    : buckets[0] ?? null;

  const artistPreview = selected
    ? selected.artists.slice(0, 3).join(", ")
    : "";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 text-center">
        {selected ? (
          <>
            <p className="text-base font-medium sm:text-lg">
              Listening to music from{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {selected.name}
              </span>
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {selected.trackCount} tracks from {selected.artistCount} artist
              {selected.artistCount === 1 ? "" : "s"}
            </p>
          </>
        ) : (
          <>
            <p className="text-base font-medium sm:text-lg">
              Music by country
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {resolving
                ? `Resolving artist countries… (${pending} left)`
                : "No country data yet — artist origins resolve via MusicBrainz"}
            </p>
          </>
        )}
      </div>

      <div
        className="relative w-full overflow-hidden rounded-lg border"
        style={{ backgroundColor: palette.ocean }}
      >
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 185, center: [8, 12] }}
          width={1100}
          height={460}
          className="h-auto w-full"
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <Geographies geography={COUNTRIES_TOPOJSON}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const rawId = String(geo.id ?? "");
                const bucket =
                  byNumeric.get(rawId) ??
                  byNumeric.get(String(Number(rawId))) ??
                  undefined;
                const iso = bucket?.iso2 ?? rawId;
                const isSelected =
                  !!selectedIso &&
                  iso.toUpperCase() === selectedIso.toUpperCase();

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(evt) => {
                      if (!bucket) return;
                      const parent = evt.currentTarget.ownerSVGElement
                        ?.parentElement as HTMLElement | null;
                      if (!parent) return;
                      const box = parent.getBoundingClientRect();
                      setTooltip({
                        x: evt.clientX - box.left,
                        y: evt.clientY - box.top,
                        bucket,
                      });
                    }}
                    onMouseMove={(evt) => {
                      if (!bucket) return;
                      const parent = evt.currentTarget.ownerSVGElement
                        ?.parentElement as HTMLElement | null;
                      if (!parent) return;
                      const box = parent.getBoundingClientRect();
                      setTooltip({
                        x: evt.clientX - box.left,
                        y: evt.clientY - box.top,
                        bucket,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => {
                      if (bucket) setSelectedIso(bucket.iso2);
                    }}
                    style={{
                      default: {
                        fill: fillForCount(
                          bucket?.trackCount,
                          maxCount,
                          isSelected,
                          palette
                        ),
                        stroke: palette.stroke,
                        strokeWidth: 0.45,
                        outline: "none",
                        cursor: bucket ? "pointer" : "default",
                      },
                      hover: {
                        fill: bucket
                          ? isSelected
                            ? palette.selectedHover
                            : palette.heatHover
                          : palette.hoverEmpty,
                        stroke: palette.stroke,
                        strokeWidth: 0.65,
                        outline: "none",
                        cursor: bucket ? "pointer" : "default",
                      },
                      pressed: {
                        fill: palette.selected,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {tooltip ? (
          <div
            className={cn(
              "pointer-events-none absolute z-10 max-w-xs rounded-lg border bg-popover/95 p-3 shadow-lg backdrop-blur-sm"
            )}
            style={{
              left: Math.min(tooltip.x + 12, Math.max(0, tooltip.x - 40)),
              top: Math.max(8, tooltip.y - 12),
            }}
          >
            <p className="text-sm font-semibold">
              {tooltip.bucket.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {tooltip.bucket.artistCount} artist
              {tooltip.bucket.artistCount === 1 ? "" : "s"}
              {tooltip.bucket.artists.length
                ? ` including ${tooltip.bucket.artists.slice(0, 3).join(", ")}`
                : ""}
            </p>
            {tooltip.bucket.covers.length > 0 ? (
              <div className="mt-2 flex gap-1">
                {tooltip.bucket.covers.slice(0, 5).map((cover, i) => (
                  <Image
                    key={`${cover}-${i}`}
                    src={cover}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className="h-8 w-8 rounded object-cover"
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {selected && artistPreview ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Artists include {artistPreview}
          {selected.artists.length > 3 ? "…" : ""}
        </p>
      ) : null}

      {(resolving || unknownArtists > 0) && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {resolving
            ? `Looking up artist countries… ${pending} remaining`
            : null}
          {!resolving && unknownArtists > 0
            ? `${unknownArtists} artist${unknownArtists === 1 ? "" : "s"} without a known country`
            : null}
        </p>
      )}
    </div>
  );
}
