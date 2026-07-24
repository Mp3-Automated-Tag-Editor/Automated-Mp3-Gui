"use client";

import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { Track } from "@/components/context/PlayerContext/types";
import { displayArtist } from "@/components/context/PlayerContext/music-utils";
import { TAURI_COMMANDS, TAURI_EVENTS } from "@/constants";

export type UseArtistCountriesResult = {
  /** Normalized artist key → ISO2 (or null if unresolved). */
  artistIso: Record<string, string | null>;
  pending: number;
  resolving: boolean;
  unknownArtists: number;
};

type ResolveResult = {
  artistIso: Record<string, string | null>;
  unknownArtists: number;
};

type ProgressPayload = {
  pending: number;
  total: number;
};

export function useArtistCountries(tracks: Track[]): UseArtistCountriesResult {
  const [artistIso, setArtistIso] = useState<Record<string, string | null>>(
    {}
  );
  const [pending, setPending] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [unknownArtists, setUnknownArtists] = useState(0);

  const artists = useMemo(() => {
    const set = new Set<string>();
    for (const t of tracks) {
      const a = displayArtist(t);
      if (a && a !== "Unknown Artist") set.add(a);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tracks]);

  const artistsKey = artists.join("\0");

  useEffect(() => {
    let cancelled = false;
    let unlisten: UnlistenFn | undefined;

    (async () => {
      if (artists.length === 0) {
        setArtistIso({});
        setPending(0);
        setResolving(false);
        setUnknownArtists(0);
        return;
      }

      setResolving(true);
      try {
        unlisten = await listen<ProgressPayload>(
          TAURI_EVENTS.artistCountryProgress,
          (event) => {
            if (cancelled) return;
            setPending(event.payload.pending);
          }
        );

        const result = await invoke<ResolveResult>(
          TAURI_COMMANDS.resolveArtistCountries,
          { artists }
        );
        if (cancelled) return;
        setArtistIso(result.artistIso ?? {});
        setUnknownArtists(result.unknownArtists ?? 0);
        setPending(0);
      } catch {
        if (!cancelled) {
          setArtistIso({});
          setUnknownArtists(artists.length);
          setPending(0);
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- artistsKey is the stable content key
  }, [artistsKey]);

  return {
    artistIso,
    pending,
    resolving,
    unknownArtists,
  };
}
