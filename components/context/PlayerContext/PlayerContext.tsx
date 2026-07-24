"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  FC,
  ReactNode,
} from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/tauri";
import { Store } from "tauri-plugin-store-api";
import {
  CONFIG_KEYS,
  EMPTY_TAG,
  PLAYER,
  STORE_FILE,
  STORE_KEYS,
  TAURI_COMMANDS,
} from "@/constants";
import { groupAlbums, groupArtists, shuffleArray } from "./music-utils";
import type {
  PlayerContextState,
  RepeatMode,
  Track,
  UserPlaylist,
} from "./types";

const store = new Store(STORE_FILE);

export const LIKED_PLAYLIST_ID = PLAYER.likedPlaylistId;
export const RECENT_PLAYLIST_ID = PLAYER.recentPlaylistId;

const defaultPlaylists = (): UserPlaylist[] => [
  { id: LIKED_PLAYLIST_ID, name: "Liked Songs", trackPaths: [] },
  { id: RECENT_PLAYLIST_ID, name: "Recently Played", trackPaths: [] },
];

const PlayerContext = createContext<PlayerContextState | null>(null);

function normalizeTrack(raw: any): Track {
  return {
    id: String(raw.id ?? raw.path ?? `${Date.now()}-${Math.random()}`),
    file: String(raw.file ?? ""),
    artist: String(raw.artist ?? EMPTY_TAG),
    title: String(raw.title ?? EMPTY_TAG),
    album: String(raw.album ?? EMPTY_TAG),
    path: String(raw.path ?? ""),
    year: Number(raw.year ?? 0),
    track: Number(raw.track ?? 0),
    genre: String(raw.genre ?? EMPTY_TAG),
    comments: String(raw.comments ?? EMPTY_TAG),
    albumArtist: String(raw.albumArtist ?? EMPTY_TAG),
    composer: String(raw.composer ?? EMPTY_TAG),
    discno: Number(raw.discno ?? 0),
    imageSrc: String(raw.imageSrc ?? ""),
    percentage: Number(raw.percentage ?? 0),
    status: String(raw.status ?? ""),
    sessionName: String(raw.sessionName ?? ""),
  };
}

export const PlayerProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [libraryPath, setLibraryPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState<number>(PLAYER.defaultVolume);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [likedPaths, setLikedPaths] = useState<string[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>(defaultPlaylists);

  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);
  const tracksRef = useRef(tracks);
  const nextRef = useRef<() => void>(() => {});

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);
  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  const currentTrack =
    currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  const persistMusicState = useCallback(
    async (partial: {
      libraryPath?: string | null;
      likedPaths?: string[];
      recentlyPlayed?: string[];
      playlists?: UserPlaylist[];
      volume?: number;
    }) => {
      try {
        await store.load();
        const existing =
          ((await store.get(STORE_KEYS.musicPlayer)) as Record<string, unknown>) || {};
        await store.set(STORE_KEYS.musicPlayer, { ...existing, ...partial });
        await store.save();
      } catch {
        // Store may be unavailable outside Tauri
      }
    },
    []
  );

  const loadFolder = useCallback(
    async (directory: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await invoke<any[]>(TAURI_COMMANDS.readMusicDirectory, { directory });
        const normalized = (result || [])
          .map(normalizeTrack)
          .filter((t) => t.path);
        setTracks(normalized);
        setLibraryPath(directory);
        await persistMusicState({ libraryPath: directory });
        if (normalized.length === 0) {
          setError("No MP3 files found in that folder.");
        }
      } catch (e: any) {
        setError(e?.message || String(e) || "Failed to load music folder.");
        setTracks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [persistMusicState]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await store.load();
        const data = (await store.get(STORE_KEYS.musicPlayer)) as {
          libraryPath?: string;
          likedPaths?: string[];
          recentlyPlayed?: string[];
          playlists?: UserPlaylist[];
          volume?: number;
        } | null;
        if (cancelled || !data) return;
        if (typeof data.volume === "number") setVolumeState(data.volume);
        if (Array.isArray(data.likedPaths)) setLikedPaths(data.likedPaths);
        if (Array.isArray(data.recentlyPlayed)) setRecentlyPlayed(data.recentlyPlayed);
        if (Array.isArray(data.playlists) && data.playlists.length) {
          const hasLiked = data.playlists.some((p) => p.id === LIKED_PLAYLIST_ID);
          const hasRecent = data.playlists.some((p) => p.id === RECENT_PLAYLIST_ID);
          let next = [...data.playlists];
          if (!hasLiked) next = [defaultPlaylists()[0], ...next];
          if (!hasRecent) {
            const liked = next.find((p) => p.id === LIKED_PLAYLIST_ID);
            const rest = next.filter(
              (p) => p.id !== LIKED_PLAYLIST_ID && p.id !== RECENT_PLAYLIST_ID
            );
            next = [
              liked ?? defaultPlaylists()[0],
              defaultPlaylists()[1],
              ...rest,
            ];
          }
          // Keep built-in playlists in sync with dedicated path lists
          next = next.map((p) => {
            if (p.id === LIKED_PLAYLIST_ID && Array.isArray(data.likedPaths)) {
              return { ...p, trackPaths: data.likedPaths };
            }
            if (p.id === RECENT_PLAYLIST_ID && Array.isArray(data.recentlyPlayed)) {
              return { ...p, trackPaths: data.recentlyPlayed };
            }
            return p;
          });
          setPlaylists(next);
        } else if (Array.isArray(data.likedPaths) || Array.isArray(data.recentlyPlayed)) {
          setPlaylists([
            {
              id: LIKED_PLAYLIST_ID,
              name: "Liked Songs",
              trackPaths: data.likedPaths ?? [],
            },
            {
              id: RECENT_PLAYLIST_ID,
              name: "Recently Played",
              trackPaths: data.recentlyPlayed ?? [],
            },
          ]);
        }
        if (data.libraryPath) {
          await loadFolder(data.libraryPath);
        } else {
          // Prefer Settings libraryPath as source of truth
          try {
            const settings = (await store.get(STORE_KEYS.settings)) as {
              [CONFIG_KEYS.libraryPath]?: string;
            } | null;
            const settingsLibraryPath = settings?.[CONFIG_KEYS.libraryPath];
            if (settingsLibraryPath) {
              await loadFolder(settingsLibraryPath);
              await persistMusicState({ libraryPath: settingsLibraryPath });
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFolder]);

  const pushRecentlyPlayed = useCallback(
    (path: string) => {
      setRecentlyPlayed((prev) => {
        const next = [path, ...prev.filter((p) => p !== path)].slice(0, PLAYER.recentLimit);
        setPlaylists((pls) => {
          const updated = pls.map((p) =>
            p.id === RECENT_PLAYLIST_ID ? { ...p, trackPaths: next } : p
          );
          persistMusicState({ recentlyPlayed: next, playlists: updated });
          return updated;
        });
        return next;
      });
    },
    [persistMusicState]
  );

  const loadAndPlay = useCallback(
    (track: Track, index: number, nextQueue: Track[]) => {
      const audio = audioRef.current;
      if (!audio) return;
      setQueue(nextQueue);
      setCurrentIndex(index);
      try {
        audio.src = convertFileSrc(track.path);
      } catch {
        audio.src = track.path;
      }
      audio.load();
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      pushRecentlyPlayed(track.path);
    },
    [pushRecentlyPlayed]
  );

  const playTrack = useCallback(
    (track: Track, list?: Track[]) => {
      const nextQueue = list && list.length ? list : tracksRef.current;
      const idx = nextQueue.findIndex((t) => t.path === track.path);
      const queueToUse = idx >= 0 ? nextQueue : [track, ...nextQueue];
      const playIndex = idx >= 0 ? idx : 0;
      loadAndPlay(queueToUse[playIndex], playIndex, queueToUse);
    },
    [loadAndPlay]
  );

  const playAlbum = useCallback(
    (albumTracks: Track[]) => {
      if (!albumTracks.length) return;
      loadAndPlay(albumTracks[0], 0, albumTracks);
    },
    [loadAndPlay]
  );

  const playLibraryShuffled = useCallback(() => {
    if (!tracksRef.current.length) return;
    const shuffled = shuffleArray(tracksRef.current);
    setShuffle(true);
    loadAndPlay(shuffled[0], 0, shuffled);
  }, [loadAndPlay]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (currentIndexRef.current < 0 || !queueRef.current.length) {
      if (tracksRef.current.length) {
        playTrack(tracksRef.current[0], tracksRef.current);
      }
      return;
    }
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [playTrack]);

  const goToIndex = useCallback(
    (index: number) => {
      const q = queueRef.current;
      if (index < 0 || index >= q.length) return;
      loadAndPlay(q[index], index, q);
    },
    [loadAndPlay]
  );

  const next = useCallback(() => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    if (!q.length) return;

    if (repeatRef.current === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      return;
    }

    if (shuffleRef.current && q.length > 1) {
      let nextIdx = Math.floor(Math.random() * q.length);
      if (nextIdx === idx) nextIdx = (nextIdx + 1) % q.length;
      goToIndex(nextIdx);
      return;
    }

    const nextIdx = idx + 1;
    if (nextIdx < q.length) {
      goToIndex(nextIdx);
    } else if (repeatRef.current === "all") {
      goToIndex(0);
    } else {
      setIsPlaying(false);
      audioRef.current?.pause();
    }
  }, [goToIndex]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setPosition(0);
      return;
    }
    if (!q.length) return;
    if (idx > 0) goToIndex(idx - 1);
    else if (repeatRef.current === "all") goToIndex(q.length - 1);
  }, [goToIndex]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setPosition(time);
  }, []);

  const setVolume = useCallback(
    (v: number) => {
      const clamped = Math.min(1, Math.max(0, v));
      setVolumeState(clamped);
      if (audioRef.current) audioRef.current.volume = clamped;
      if (clamped > 0) setMuted(false);
      persistMusicState({ volume: clamped });
    },
    [persistMusicState]
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const nextMuted = !m;
      if (audioRef.current) audioRef.current.muted = nextMuted;
      return nextMuted;
    });
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  const playNext = useCallback(
    (track: Track) => {
      setQueue((q) => {
        if (!q.length || currentIndexRef.current < 0) {
          loadAndPlay(track, 0, [track]);
          return [track];
        }
        const currentPath = q[currentIndexRef.current]?.path;
        const filtered = q.filter((t) => t.path !== track.path);
        const cur = filtered.findIndex((t) => t.path === currentPath);
        const at = cur >= 0 ? cur + 1 : filtered.length;
        filtered.splice(at, 0, track);
        const newCurrent = filtered.findIndex((t) => t.path === currentPath);
        if (newCurrent >= 0) {
          currentIndexRef.current = newCurrent;
          setCurrentIndex(newCurrent);
        }
        return filtered;
      });
    },
    [loadAndPlay]
  );

  const playLater = useCallback(
    (track: Track) => {
      setQueue((q) => {
        if (!q.length || currentIndexRef.current < 0) {
          loadAndPlay(track, 0, [track]);
          return [track];
        }
        if (q.some((t) => t.path === track.path)) return q;
        return [...q, track];
      });
    },
    [loadAndPlay]
  );

  const playNextMany = useCallback(
    (list: Track[]) => {
      setQueue((q) => {
        if (!list.length) return q;
        if (!q.length || currentIndexRef.current < 0) {
          loadAndPlay(list[0], 0, list);
          return list;
        }
        const currentPath = q[currentIndexRef.current]?.path;
        const toAdd = list.filter((t) => !q.some((x) => x.path === t.path));
        const nextQ = [...q];
        const cur = nextQ.findIndex((t) => t.path === currentPath);
        nextQ.splice(cur + 1, 0, ...toAdd);
        const newCurrent = nextQ.findIndex((t) => t.path === currentPath);
        if (newCurrent >= 0) {
          currentIndexRef.current = newCurrent;
          setCurrentIndex(newCurrent);
        }
        return nextQ;
      });
    },
    [loadAndPlay]
  );

  const playLaterMany = useCallback(
    (list: Track[]) => {
      setQueue((q) => {
        if (!list.length) return q;
        if (!q.length || currentIndexRef.current < 0) {
          loadAndPlay(list[0], 0, list);
          return list;
        }
        const existing = new Set(q.map((t) => t.path));
        return [...q, ...list.filter((t) => !existing.has(t.path))];
      });
    },
    [loadAndPlay]
  );

  const isLiked = useCallback(
    (path: string) => likedPaths.includes(path),
    [likedPaths]
  );

  const toggleLike = useCallback(
    (track: Track) => {
      setLikedPaths((prev) => {
        const exists = prev.includes(track.path);
        const next = exists
          ? prev.filter((p) => p !== track.path)
          : [...prev, track.path];
        setPlaylists((pls) => {
          const updated = pls.map((p) =>
            p.id === LIKED_PLAYLIST_ID ? { ...p, trackPaths: next } : p
          );
          persistMusicState({ likedPaths: next, playlists: updated });
          return updated;
        });
        return next;
      });
    },
    [persistMusicState]
  );

  const createPlaylist = useCallback(
    (name: string, trackPaths: string[] = []) => {
      const id = `playlist-${Date.now()}`;
      setPlaylists((prev) => {
        const updated = [...prev, { id, name, trackPaths }];
        persistMusicState({ playlists: updated });
        return updated;
      });
      return id;
    },
    [persistMusicState]
  );

  const addToPlaylist = useCallback(
    (playlistId: string, trackPathsToAdd: string[]) => {
      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== playlistId) return p;
          const merged = Array.from(new Set([...p.trackPaths, ...trackPathsToAdd]));
          return { ...p, trackPaths: merged };
        });
        persistMusicState({ playlists: updated });
        return updated;
      });
    },
    [persistMusicState]
  );

  const getPlaylistTracks = useCallback(
    (playlistId: string) => {
      const pl = playlists.find((p) => p.id === playlistId);
      if (!pl) return [];
      const byPath = new Map(tracks.map((t) => [t.path, t]));
      return pl.trackPaths.map((p) => byPath.get(p)).filter(Boolean) as Track[];
    },
    [playlists, tracks]
  );

  const createStation = useCallback(
    (seed: Track) => {
      const pool = tracksRef.current.filter(
        (t) => t.artist === seed.artist || t.album === seed.album
      );
      const source = pool.length ? pool : tracksRef.current;
      if (!source.length) return;
      const shuffled = shuffleArray(source);
      setShuffle(true);
      loadAndPlay(shuffled[0], 0, shuffled);
    },
    [loadAndPlay]
  );

  const upsertTrackMetadata = useCallback(
    (partial: Partial<Track> & { path: string }) => {
      const merge = (t: Track): Track =>
        t.path === partial.path ? { ...t, ...partial, path: t.path } : t;

      setTracks((prev) => prev.map(merge));
      setQueue((prev) => prev.map(merge));
    },
    []
  );

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = PLAYER.defaultVolume;
    audioRef.current = audio;

    const onTime = () => setPosition(audio.currentTime || 0);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => nextRef.current();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  const albums = useMemo(() => groupAlbums(tracks), [tracks]);
  const artists = useMemo(() => groupArtists(tracks), [tracks]);

  const listenNowAlbums = useMemo(() => {
    const recent = recentlyPlayed
      .map((p) => tracks.find((t) => t.path === p))
      .filter(Boolean) as Track[];
    const source = recent.length ? recent : tracks.slice(0, 24);
    return groupAlbums(source).slice(0, 12);
  }, [recentlyPlayed, tracks]);

  const madeForYouAlbums = useMemo(() => {
    const liked = likedPaths
      .map((p) => tracks.find((t) => t.path === p))
      .filter(Boolean) as Track[];
    if (liked.length) return groupAlbums(liked).slice(0, 12);
    return shuffleArray(albums).slice(0, 8);
  }, [likedPaths, tracks, albums]);

  const likedTracks = useMemo(() => {
    const byPath = new Map(tracks.map((t) => [t.path, t]));
    return likedPaths.map((p) => byPath.get(p)).filter(Boolean) as Track[];
  }, [likedPaths, tracks]);

  const value: PlayerContextState = {
    tracks,
    libraryPath,
    isLoading,
    error,
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    position,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    likedPaths,
    recentlyPlayed,
    playlists,
    loadFolder,
    playTrack,
    playAlbum,
    playLibraryShuffled,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    playNext,
    playLater,
    playNextMany,
    playLaterMany,
    toggleLike,
    isLiked,
    createPlaylist,
    addToPlaylist,
    getPlaylistTracks,
    createStation,
    upsertTrackMetadata,
    albums,
    artists,
    listenNowAlbums,
    madeForYouAlbums,
    likedTracks,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};

export function usePlayer(): PlayerContextState {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return ctx;
}

export default PlayerProvider;
