"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { open } from "@tauri-apps/api/dialog";
import { Store } from "tauri-plugin-store-api";
import { Music } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Heading } from "@/components/heading";
import { usePlayer } from "@/components/context/PlayerContext";
import type {
  AlbumGroup,
  MusicView,
} from "@/components/context/PlayerContext/types";
import {
  displayAlbum,
  displayArtist,
  displayTitle,
} from "@/components/context/PlayerContext/music-utils";
import { useToast } from "@/components/ui/use-toast";
import { ConfigContext } from "@/components/context/ConfigContext";
import { LibraryGate, useLibraryPath } from "@/components/library-gate";
import { CONFIG_KEYS, PLAYER, STORE_FILE, STORE_KEYS } from "@/constants";

import { AlbumArtwork } from "./components/album-artwork";
import { Sidebar } from "./components/sidebar";
import { PlayerBar } from "./components/player-bar";
import { SongList } from "./components/song-list";
import { NowPlayingPanel } from "./components/now-playing-panel";
import { AlbumDetail } from "./components/album-detail";
import { ArtistDetail } from "./components/artist-detail";
import { CreatePlaylistDialog } from "./components/create-playlist-dialog";
import {
  MusicSearchBar,
  scopeForView,
  type SearchScope,
} from "./components/music-search-bar";
import { LibrarySortSelect } from "./components/library-sort-select";
import {
  ALBUM_SORT_OPTIONS,
  ARTIST_SORT_OPTIONS,
  SONG_SORT_OPTIONS,
  sortAlbums,
  sortArtists,
  sortSongs,
  type AlbumSortKey,
  type ArtistSortKey,
  type SongSortKey,
} from "./components/library-sort";

const store = new Store(STORE_FILE);

type NavFrame = {
  view: MusicView;
  tab: string;
  playlistId: string | null;
  albumKey: string | null;
  artistName: string | null;
};

function albumKeyOf(album: Pick<AlbumGroup, "name" | "artist">) {
  return `${album.name}::${album.artist}`.toLowerCase();
}

const MusicPlayer = () => {
  const {
    tracks,
    albums,
    artists,
    listenNowAlbums,
    madeForYouAlbums,
    playlists,
    likedTracks,
    isLoading,
    isScanning,
    scanProgress,
    error,
    libraryPath: playerLibraryPath,
    loadFolder,
    playLibraryShuffled,
    getPlaylistTracks,
    createPlaylist,
  } = usePlayer();
  const { configs, addConfig } = useContext(ConfigContext);
  const settingsLibraryPath = useLibraryPath();
  const { toast } = useToast();

  const [tab, setTab] = useState("music");
  const [view, setView] = useState<MusicView>("home");
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [selectedAlbumKey, setSelectedAlbumKey] = useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(
    null
  );
  const [navHistory, setNavHistory] = useState<NavFrame[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const scopePinnedRef = useRef(false);

  const [albumSort, setAlbumSort] = useState<AlbumSortKey>("name-asc");
  const [artistSort, setArtistSort] = useState<ArtistSortKey>("name-asc");
  const [songSort, setSongSort] = useState<SongSortKey>("title-asc");

  const [musicSidebarOpen, setMusicSidebarOpen] = useState(true);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  const pinScope = (pinned: boolean) => {
    scopePinnedRef.current = pinned;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await store.load();
        const data = (await store.get(STORE_KEYS.musicPlayer)) as Record<
          string,
          unknown
        > | null;
        if (cancelled || !data) return;
        if (typeof data[PLAYER.musicSidebarOpenKey] === "boolean") {
          setMusicSidebarOpen(data[PLAYER.musicSidebarOpenKey] as boolean);
        }
      } catch {
        // Store may be unavailable outside Tauri
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistSidebarOpen = useCallback(async (open: boolean) => {
    try {
      await store.load();
      const existing =
        ((await store.get(STORE_KEYS.musicPlayer)) as Record<
          string,
          unknown
        >) || {};
      await store.set(STORE_KEYS.musicPlayer, {
        ...existing,
        [PLAYER.musicSidebarOpenKey]: open,
      });
      await store.save();
    } catch {
      // ignore
    }
  }, []);

  const toggleMusicSidebar = () => {
    setMusicSidebarOpen((prev) => {
      const next = !prev;
      void persistSidebarOpen(next);
      return next;
    });
  };

  const snapshotFrame = useCallback((): NavFrame => {
    return {
      view,
      tab,
      playlistId: activePlaylistId,
      albumKey: selectedAlbumKey,
      artistName: selectedArtistName,
    };
  }, [view, tab, activePlaylistId, selectedAlbumKey, selectedArtistName]);

  const pushHistory = useCallback(() => {
    setNavHistory((h) => [...h, snapshotFrame()]);
  }, [snapshotFrame]);

  const applyFrame = (frame: NavFrame) => {
    setView(frame.view);
    setTab(frame.tab);
    setActivePlaylistId(frame.playlistId);
    setSelectedAlbumKey(frame.albumKey);
    setSelectedArtistName(frame.artistName);
    if (!scopePinnedRef.current) {
      setSearchScope(scopeForView(frame.view, frame.tab));
    }
  };

  const goBack = () => {
    if (!navHistory.length) {
      setView("home");
      setTab("music");
      setSelectedAlbumKey(null);
      setSelectedArtistName(null);
      setActivePlaylistId(null);
      if (!scopePinnedRef.current) {
        setSearchScope("all");
      }
      return;
    }
    const prev = navHistory[navHistory.length - 1];
    setNavHistory((h) => h.slice(0, -1));
    applyFrame(prev);
  };

  const navigateTo = (
    next: MusicView,
    opts?: {
      playlistId?: string | null;
      albumKey?: string | null;
      artistName?: string | null;
      push?: boolean;
      clearSearch?: boolean;
      forceScope?: SearchScope;
    }
  ) => {
    const push = opts?.push ?? false;
    if (push) pushHistory();

    let resolved: MusicView = next === "browse" ? "albums" : next;
    let nextTab = "music";
    if (resolved === "songs" || resolved === "playlist") nextTab = "list";
    else if (resolved === "player") nextTab = "player";

    setView(resolved);
    setTab(nextTab);
    setActivePlaylistId(
      opts?.playlistId !== undefined ? opts.playlistId : null
    );
    setSelectedAlbumKey(
      opts?.albumKey !== undefined ? opts.albumKey : null
    );
    setSelectedArtistName(
      opts?.artistName !== undefined ? opts.artistName : null
    );

    if (opts?.forceScope !== undefined) {
      pinScope(false);
      setSearchScope(opts.forceScope);
    } else if (!scopePinnedRef.current) {
      setSearchScope(scopeForView(resolved, nextTab));
    }

    if (opts?.clearSearch) {
      setSearchQuery("");
      pinScope(false);
      setSearchScope(scopeForView(resolved, nextTab));
    }
  };

  const onSidebarNavigate = (
    next: MusicView,
    playlistId?: string | null
  ) => {
    setNavHistory([]);
    pinScope(false);
    navigateTo(next === "browse" ? "albums" : next, {
      playlistId: playlistId ?? null,
      albumKey: null,
      artistName: null,
      clearSearch: true,
    });
  };

  const openAlbum = (albumName: string, albumArtist: string) => {
    const key = `${albumName}::${albumArtist}`.toLowerCase();
    if (view === "album-detail" && selectedAlbumKey === key) return;
    navigateTo("album-detail", {
      albumKey: key,
      artistName: null,
      playlistId: null,
      push: true,
    });
  };

  const openArtist = (artistName: string) => {
    if (
      view === "artist-detail" &&
      selectedArtistName?.toLowerCase() === artistName.toLowerCase()
    ) {
      return;
    }
    navigateTo("artist-detail", {
      artistName,
      albumKey: null,
      playlistId: null,
      push: true,
    });
  };

  const handleScopeChange = (scope: SearchScope) => {
    if (scope === "all") {
      setSearchScope("all");
      pinScope(true);
      return;
    }

    pinScope(false);
    setSearchScope(scope);

    const onArtists =
      view === "artists" || view === "artist-detail";
    const onAlbums =
      view === "albums" ||
      view === "browse" ||
      view === "album-detail" ||
      view === "home";
    const onSongs =
      view === "songs" ||
      view === "playlist" ||
      view === "made-for-you";
    const onPlaylists = view === "playlists";
    const onQueue = view === "player" || tab === "player";

    if (scope === "artists" && !onArtists) {
      setNavHistory([]);
      navigateTo("artists", { forceScope: "artists" });
    } else if (scope === "albums" && !onAlbums) {
      setNavHistory([]);
      navigateTo("albums", { forceScope: "albums" });
    } else if (scope === "songs" && !onSongs) {
      setNavHistory([]);
      navigateTo("songs", { forceScope: "songs" });
    } else if (scope === "playlists" && !onPlaylists) {
      setNavHistory([]);
      navigateTo("playlists", { forceScope: "playlists" });
    } else if (scope === "queue" && !onQueue) {
      setNavHistory([]);
      navigateTo("player", { forceScope: "queue" });
    }
  };

  const activePlaylistTracks = useMemo(() => {
    if (!activePlaylistId) return [];
    return getPlaylistTracks(activePlaylistId);
  }, [activePlaylistId, getPlaylistTracks, playlists, tracks]);

  const activePlaylistName =
    playlists.find((p) => p.id === activePlaylistId)?.name ?? "Playlist";

  const selectedAlbum = useMemo(() => {
    if (!selectedAlbumKey) return null;
    return albums.find((a) => albumKeyOf(a) === selectedAlbumKey) ?? null;
  }, [albums, selectedAlbumKey]);

  const selectedArtist = useMemo(() => {
    if (!selectedArtistName) return null;
    return (
      artists.find(
        (a) => a.name.toLowerCase() === selectedArtistName.toLowerCase()
      ) ?? null
    );
  }, [artists, selectedArtistName]);

  const q = searchQuery.trim().toLowerCase();

  const filteredAlbums = useMemo(() => {
    if (!q) return albums;
    if (searchScope !== "all" && searchScope !== "albums") return albums;
    return albums.filter(
      (a) =>
        a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
    );
  }, [albums, q, searchScope]);

  const sortedAlbums = useMemo(
    () => sortAlbums(filteredAlbums, albumSort),
    [filteredAlbums, albumSort]
  );

  const filteredListenNow = useMemo(() => {
    const list = listenNowAlbums.length ? listenNowAlbums : albums.slice(0, 8);
    if (!q) return list;
    if (searchScope !== "all" && searchScope !== "albums") return list;
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
    );
  }, [listenNowAlbums, albums, q, searchScope]);

  const filteredMadeForYou = useMemo(() => {
    if (!q) return madeForYouAlbums;
    if (searchScope !== "all" && searchScope !== "albums") {
      return madeForYouAlbums;
    }
    return madeForYouAlbums.filter(
      (a) =>
        a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
    );
  }, [madeForYouAlbums, q, searchScope]);

  const filteredArtists = useMemo(() => {
    if (!q) return artists;
    if (searchScope !== "all" && searchScope !== "artists") return artists;
    return artists.filter((a) => a.name.toLowerCase().includes(q));
  }, [artists, q, searchScope]);

  const sortedArtists = useMemo(
    () => sortArtists(filteredArtists, artistSort),
    [filteredArtists, artistSort]
  );

  const filteredPlaylists = useMemo(() => {
    if (!q) return playlists;
    if (searchScope !== "all" && searchScope !== "playlists") return playlists;
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, q, searchScope]);

  const filteredSongs = useMemo(() => {
    if (!q) return tracks;
    if (searchScope !== "all" && searchScope !== "songs") return tracks;
    return tracks.filter((t) => {
      const hay =
        `${displayTitle(t)} ${displayArtist(t)} ${displayAlbum(t)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [tracks, q, searchScope]);

  const sortedSongs = useMemo(
    () => sortSongs(filteredSongs, songSort),
    [filteredSongs, songSort]
  );

  const songFilterQuery =
    searchScope === "all" || searchScope === "songs" ? searchQuery : "";

  const queueFilterQuery =
    searchScope === "all" || searchScope === "queue" ? searchQuery : "";

  const showUnifiedSearch = searchScope === "all" && q.length > 0;
  const handleAddMusic = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select a music folder",
      });
      if (!selected || Array.isArray(selected)) return;
      await addConfig(configs, {
        key: CONFIG_KEYS.libraryPath,
        value: selected,
      });
      await loadFolder(selected);
      toast({
        title: "Library loaded",
        description: selected,
      });
      setNavHistory([]);
      navigateTo("home", { clearSearch: true });
    } catch (e: any) {
      toast({
        title: "Could not open folder",
        description: e?.message || String(e),
        variant: "destructive",
      });
    }
  };

  const libraryPath = settingsLibraryPath || playerLibraryPath;
  const emptyLibrary = !isLoading && !isScanning && tracks.length === 0;
  const needsGate =
    !settingsLibraryPath && !playerLibraryPath && emptyLibrary;

  const albumGrid = (
    list: typeof albums,
    size: "lg" | "sm" = "lg"
  ) => (
    <ScrollArea>
      <div className="flex space-x-4 pb-4">
        {list.map((album) => (
          <AlbumArtwork
            key={`${album.name}-${album.artist}`}
            album={album}
            className={size === "lg" ? "w-[250px]" : "w-[150px]"}
            aspectRatio={size === "lg" ? "portrait" : "square"}
            width={size === "lg" ? 250 : 150}
            height={size === "lg" ? 330 : 150}
            onOpenAlbum={() => openAlbum(album.name, album.artist)}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );

  const songNavProps = {
    filterQuery: songFilterQuery,
    onOpenAlbum: openAlbum,
    onOpenArtist: openArtist,
  };

  const renderMainContent = () => {
    if (isLoading && tracks.length === 0) {
      return (
        <p className="py-12 text-sm text-muted-foreground">Loading library…</p>
      );
    }

    if (isScanning && tracks.length === 0) {
      return (
        <p className="py-12 text-sm text-muted-foreground">
          Indexing library
          {scanProgress
            ? ` · ${scanProgress.done}/${scanProgress.total || "…"}`
            : "…"}
        </p>
      );
    }

    if (needsGate) {
      return (
        <div className="py-4">
          <LibraryGate />
        </div>
      );
    }

    if (emptyLibrary) {
      return (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-8">
          <h3 className="text-lg font-semibold">No music loaded</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Choose a folder of MP3 files to build your library. Your last folder
            is remembered for next time.
          </p>
          <Button onClick={handleAddMusic}>
            <PlusCircledIcon className="mr-2 h-4 w-4" />
            Add music
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );
    }

    if (showUnifiedSearch) {
      const hasAlbums = sortedAlbums.length > 0;
      const hasArtists = sortedArtists.length > 0;
      const hasSongs = sortedSongs.length > 0;
      const hasPlaylists = filteredPlaylists.length > 0;
      const hasAny = hasAlbums || hasArtists || hasSongs || hasPlaylists;

      return (
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Search results
            </h2>
            <p className="text-sm text-muted-foreground">
              Matching albums, artists, songs, and playlists
            </p>
          </div>
          {!hasAny && (
            <p className="text-sm text-muted-foreground">
              No results for “{searchQuery.trim()}”.
            </p>
          )}
          {hasAlbums && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-medium">
                  Albums ({sortedAlbums.length})
                </h3>
                <LibrarySortSelect
                  value={albumSort}
                  options={ALBUM_SORT_OPTIONS}
                  onValueChange={(v) => setAlbumSort(v as AlbumSortKey)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {sortedAlbums.map((album) => (
                  <AlbumArtwork
                    key={`${album.name}-${album.artist}`}
                    album={album}
                    aspectRatio="square"
                    width={180}
                    height={180}
                    onOpenAlbum={() => openAlbum(album.name, album.artist)}
                  />
                ))}
              </div>
            </section>
          )}
          {hasArtists && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-medium">
                  Artists ({sortedArtists.length})
                </h3>
                <LibrarySortSelect
                  value={artistSort}
                  options={ARTIST_SORT_OPTIONS}
                  onValueChange={(v) => setArtistSort(v as ArtistSortKey)}
                />
              </div>
              <div className="space-y-4">
                {sortedArtists.map((artist) => (
                  <button
                    key={artist.name}
                    type="button"
                    className="block w-full rounded-md border px-4 py-3 text-left hover:bg-accent"
                    onClick={() => openArtist(artist.name)}
                  >
                    <span className="font-medium">{artist.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {artist.tracks.length} songs · {artist.albums.length}{" "}
                      albums
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {hasSongs && (
            <section>
              <SongList
                tracks={sortedSongs}
                title={`Songs (${sortedSongs.length})`}
                description="Matching tracks"
                emptyMessage="No matching songs."
                fillHeight={false}
                filterQuery=""
                showSort
                sortKey={songSort}
                onSortKeyChange={setSongSort}
                onOpenAlbum={openAlbum}
                onOpenArtist={openArtist}
              />
            </section>
          )}
          {hasPlaylists && (
            <section className="space-y-3">
              <h3 className="text-lg font-medium">
                Playlists ({filteredPlaylists.length})
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredPlaylists.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    className="rounded-lg border p-4 text-left hover:bg-accent"
                    onClick={() =>
                      navigateTo("playlist", {
                        playlistId: pl.id,
                        push: true,
                      })
                    }
                  >
                    <span className="font-medium">{pl.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {pl.trackPaths.length} tracks
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      );
    }

    if (view === "album-detail") {
      if (!selectedAlbum) {
        return (
          <p className="py-8 text-sm text-muted-foreground">Album not found.</p>
        );
      }
      return (
        <AlbumDetail
          album={selectedAlbum}
          filterQuery={songFilterQuery}
          onBack={goBack}
          onOpenArtist={openArtist}
          onOpenAlbum={openAlbum}
        />
      );
    }

    if (view === "artist-detail") {
      if (!selectedArtist) {
        return (
          <p className="py-8 text-sm text-muted-foreground">Artist not found.</p>
        );
      }
      return (
        <ArtistDetail
          artist={selectedArtist}
          filterQuery={
            searchScope === "all" ||
            searchScope === "artists" ||
            searchScope === "songs" ||
            searchScope === "albums"
              ? searchQuery
              : ""
          }
          onBack={goBack}
          onOpenAlbum={openAlbum}
          onOpenArtist={openArtist}
        />
      );
    }

    if (view === "songs" || tab === "list") {
      if (view === "playlist" && activePlaylistId) {
        return (
          <div className="h-full min-h-0">
            <SongList
              tracks={activePlaylistTracks}
              title={activePlaylistName}
              description={`${activePlaylistTracks.length} songs`}
              emptyMessage="This playlist is empty."
              {...songNavProps}
            />
          </div>
        );
      }
      return (
        <div className="h-full min-h-0">
          <SongList
            tracks={tracks}
            title="Songs"
            description={`${tracks.length} tracks${
              libraryPath ? ` from ${libraryPath}` : ""
            }${
              isScanning && scanProgress
                ? ` · indexing ${scanProgress.done}/${
                    scanProgress.total || "…"
                  }`
                : ""
            }`}
            showSort
            sortKey={songSort}
            onSortKeyChange={setSongSort}
            {...songNavProps}
          />
        </div>
      );
    }

    if (tab === "player" || view === "player") {
      return (
        <div className="h-full min-h-0">
          <NowPlayingPanel filterQuery={queueFilterQuery} />
        </div>
      );
    }

    if (view === "browse" || view === "albums") {
      return (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">Albums</h2>
              <p className="text-sm text-muted-foreground">
                {sortedAlbums.length} albums
                {q ? " matching your search" : " in your library"}
              </p>
            </div>
            <LibrarySortSelect
              value={albumSort}
              options={ALBUM_SORT_OPTIONS}
              onValueChange={(v) => setAlbumSort(v as AlbumSortKey)}
            />
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {sortedAlbums.map((album) => (
              <AlbumArtwork
                key={`${album.name}-${album.artist}`}
                album={album}
                aspectRatio="square"
                width={180}
                height={180}
                onOpenAlbum={() => openAlbum(album.name, album.artist)}
              />
            ))}
          </div>
        </>
      );
    }

    if (view === "artists") {
      return (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">Artists</h2>
              <p className="text-sm text-muted-foreground">
                {sortedArtists.length} artists
                {q ? " matching your search" : ""}
              </p>
            </div>
            <LibrarySortSelect
              value={artistSort}
              options={ARTIST_SORT_OPTIONS}
              onValueChange={(v) => setArtistSort(v as ArtistSortKey)}
            />
          </div>
          <Separator className="my-4" />
          <div className="space-y-6">
            {sortedArtists.map((artist) => (
              <div key={artist.name}>
                <button
                  type="button"
                  className="mb-2 text-left text-lg font-medium hover:underline"
                  onClick={() => openArtist(artist.name)}
                >
                  {artist.name}
                </button>
                <p className="mb-3 text-xs text-muted-foreground">
                  {artist.tracks.length} songs · {artist.albums.length} albums
                </p>
                {albumGrid(artist.albums, "sm")}
              </div>
            ))}
          </div>
        </>
      );
    }

    if (view === "playlists") {
      return (
        <>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Playlists
              </h2>
              <p className="text-sm text-muted-foreground">
                Your saved playlists
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setPlaylistDialogOpen(true)}
            >
              <PlusCircledIcon className="mr-2 h-4 w-4" />
              New playlist
            </Button>
          </div>
          <Separator className="my-4" />
          <div className="grid gap-2 sm:grid-cols-2">
            {filteredPlaylists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                className="rounded-lg border p-4 text-left hover:bg-accent"
                onClick={() =>
                  navigateTo("playlist", {
                    playlistId: pl.id,
                    push: true,
                  })
                }
              >
                <p className="font-medium">{pl.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pl.trackPaths.length} songs
                </p>
              </button>
            ))}
          </div>
        </>
      );
    }

    if (view === "made-for-you") {
      return (
        <>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Made for You
            </h2>
            <p className="text-sm text-muted-foreground">
              Liked albums and picks from your library
            </p>
          </div>
          <Separator className="my-4" />
          {likedTracks.length > 0 && (
            <>
              <SongList
                tracks={likedTracks}
                title="Liked Songs"
                description={`${likedTracks.length} songs`}
                emptyMessage="No liked songs yet."
                fillHeight={false}
                {...songNavProps}
              />
              <Separator className="my-6" />
            </>
          )}
          {albumGrid(filteredMadeForYou, "sm")}
        </>
      );
    }

    if (view === "playlist" && activePlaylistId) {
      return (
        <div className="h-full min-h-0">
          <SongList
            tracks={activePlaylistTracks}
            title={activePlaylistName}
            description={`${activePlaylistTracks.length} songs`}
            emptyMessage="This playlist is empty."
            {...songNavProps}
          />
        </div>
      );
    }

    // Home / Listen Now
    return (
      <>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Listen Now
            </h2>
            <p className="text-sm text-muted-foreground">
              {recentLabel(filteredListenNow.length, libraryPath)}
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="relative">
          {filteredListenNow.length
            ? albumGrid(filteredListenNow, "lg")
            : (
              <p className="text-sm text-muted-foreground">
                No albums match your search.
              </p>
            )}
        </div>
        <div className="mt-6 space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Made for You
          </h2>
          <p className="text-sm text-muted-foreground">
            Personal picks from your library
          </p>
        </div>
        <Separator className="my-4" />
        <div className="relative">{albumGrid(filteredMadeForYou, "sm")}</div>
      </>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 lg:px-8">
        <Heading
          title="Music Playstation"
          description="Play your local MP3 library."
          icon={Music}
          iconColor="text-green-700"
          otherProps="mb-4 shrink-0 px-0"
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t">
          <div className="flex min-h-0 flex-1 overflow-hidden bg-background">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:border-r">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-4 lg:px-6 lg:py-6">
                <Tabs
                  value={tab}
                  onValueChange={(v) => {
                    setTab(v);
                    setNavHistory([]);
                    pinScope(false);
                    if (v === "music") {
                      setView("home");
                      setSearchScope("all");
                    }
                    if (v === "list") {
                      setView("songs");
                      setSearchScope("songs");
                    }
                    if (v === "player") {
                      setView("player");
                      setSearchScope("queue");
                    }
                    setSelectedAlbumKey(null);
                    setSelectedArtistName(null);
                    setActivePlaylistId(null);
                  }}
                  className="flex min-h-0 flex-1 flex-col gap-4"
                >
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <TabsList>
                      <TabsTrigger value="music">Home</TabsTrigger>
                      <TabsTrigger value="list">List</TabsTrigger>
                      <TabsTrigger value="player">Music Player</TabsTrigger>
                      <TabsTrigger value="live" disabled>
                        Live
                      </TabsTrigger>
                    </TabsList>
                    <MusicSearchBar
                      value={searchQuery}
                      scope={searchScope}
                      onValueChange={setSearchQuery}
                      onScopeChange={handleScopeChange}
                      className="min-w-[12rem] max-w-md flex-1"
                    />
                    <div className="ml-auto">
                      <Button onClick={handleAddMusic} disabled={isLoading}>
                        <PlusCircledIcon className="mr-2 h-4 w-4" />
                        Add music
                      </Button>
                    </div>
                  </div>
                  <TabsContent
                    value="music"
                    className="mt-0 min-h-0 flex-1 overflow-y-auto border-none p-0 outline-none data-[state=inactive]:hidden"
                  >
                    {renderMainContent()}
                  </TabsContent>
                  <TabsContent
                    value="list"
                    className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden border-none p-0 data-[state=active]:flex data-[state=inactive]:hidden"
                  >
                    {renderMainContent()}
                  </TabsContent>
                  <TabsContent
                    value="player"
                    className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden border-none p-0 data-[state=active]:flex data-[state=inactive]:hidden"
                  >
                    {renderMainContent()}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <Sidebar
              playlists={playlists}
              activeView={view}
              activePlaylistId={activePlaylistId}
              isOpen={musicSidebarOpen}
              onToggle={toggleMusicSidebar}
              className="hidden min-h-0 lg:flex"
              onNavigate={onSidebarNavigate}
              onRadio={() => {
                if (!tracks.length) {
                  toast({
                    title: "No music loaded",
                    description: "Add a music folder first.",
                  });
                  return;
                }
                playLibraryShuffled();
                setNavHistory([]);
                navigateTo("player", { clearSearch: true });
                toast({
                  title: "Radio started",
                  description: "Shuffling your library",
                });
              }}
            />
          </div>
        </div>
      </div>
      <PlayerBar
        onOpenPlayer={() => {
          setNavHistory([]);
          navigateTo("player");
        }}
      />
      <CreatePlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        onConfirm={(name) => {
          const id = createPlaylist(name);
          toast({ title: "Playlist created", description: name });
          setNavHistory([]);
          navigateTo("playlist", { playlistId: id });
        }}
      />
    </div>
  );
};

function recentLabel(count: number, path: string | null) {
  if (!count) return "Add music to see recommendations.";
  return path ? `From your library · ${path}` : "Top picks from your library.";
}

export default MusicPlayer;
