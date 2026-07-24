"use client";

import { useContext, useMemo, useState } from "react";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { open } from "@tauri-apps/api/dialog";
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
import type { MusicView } from "@/components/context/PlayerContext/types";
import { useToast } from "@/components/ui/use-toast";
import { ConfigContext } from "@/components/context/ConfigContext";
import { LibraryGate, useLibraryPath } from "@/components/library-gate";
import { CONFIG_KEYS } from "@/constants";

import { AlbumArtwork } from "./components/album-artwork";
import { Sidebar } from "./components/sidebar";
import { PlayerBar } from "./components/player-bar";
import { SongList } from "./components/song-list";
import { NowPlayingPanel } from "./components/now-playing-panel";

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

  const activePlaylistTracks = useMemo(() => {
    if (!activePlaylistId) return [];
    return getPlaylistTracks(activePlaylistId);
  }, [activePlaylistId, getPlaylistTracks, playlists, tracks]);

  const activePlaylistName =
    playlists.find((p) => p.id === activePlaylistId)?.name ?? "Playlist";

  const handleAddMusic = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select a music folder",
      });
      if (!selected || Array.isArray(selected)) return;
      await addConfig(configs, { key: CONFIG_KEYS.libraryPath, value: selected });
      await loadFolder(selected);
      toast({
        title: "Library loaded",
        description: selected,
      });
      setView("home");
      setTab("music");
    } catch (e: any) {
      toast({
        title: "Could not open folder",
        description: e?.message || String(e),
        variant: "destructive",
      });
    }
  };

  const onNavigate = (next: MusicView, playlistId?: string | null) => {
    setView(next);
    setActivePlaylistId(playlistId ?? null);
    if (next === "songs" || next === "playlist") setTab("list");
    else if (next === "player") setTab("player");
    else setTab("music");
  };

  const libraryPath = settingsLibraryPath || playerLibraryPath;
  const emptyLibrary = !isLoading && tracks.length === 0;
  const needsGate = !settingsLibraryPath && !playerLibraryPath && emptyLibrary;

  const albumGrid = (list: typeof albums, size: "lg" | "sm" = "lg") => (
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
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <p className="py-12 text-sm text-muted-foreground">Loading library…</p>
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

    if (view === "songs" || tab === "list") {
      if (view === "playlist" && activePlaylistId) {
        return (
          <div className="h-full min-h-0">
            <SongList
              tracks={activePlaylistTracks}
              title={activePlaylistName}
              description={`${activePlaylistTracks.length} songs`}
              emptyMessage="This playlist is empty."
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
            }`}
          />
        </div>
      );
    }

    if (tab === "player" || view === "player") {
      return (
        <div className="h-full min-h-0">
          <NowPlayingPanel />
        </div>
      );
    }

    if (view === "browse" || view === "albums") {
      return (
        <>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Albums</h2>
            <p className="text-sm text-muted-foreground">
              {albums.length} albums in your library
            </p>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {albums.map((album) => (
              <AlbumArtwork
                key={`${album.name}-${album.artist}`}
                album={album}
                aspectRatio="square"
                width={180}
                height={180}
              />
            ))}
          </div>
        </>
      );
    }

    if (view === "artists") {
      return (
        <>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Artists</h2>
            <p className="text-sm text-muted-foreground">
              {artists.length} artists
            </p>
          </div>
          <Separator className="my-4" />
          <div className="space-y-6">
            {artists.map((artist) => (
              <div key={artist.name}>
                <h3 className="mb-2 text-lg font-medium">{artist.name}</h3>
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
              onClick={() => {
                const name = window.prompt("New playlist name");
                if (!name?.trim()) return;
                const id = createPlaylist(name.trim());
                toast({ title: "Playlist created", description: name.trim() });
                onNavigate("playlist", id);
              }}
            >
              <PlusCircledIcon className="mr-2 h-4 w-4" />
              New playlist
            </Button>
          </div>
          <Separator className="my-4" />
          <div className="grid gap-2 sm:grid-cols-2">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                className="rounded-lg border p-4 text-left hover:bg-accent"
                onClick={() => onNavigate("playlist", pl.id)}
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
              />
              <Separator className="my-6" />
            </>
          )}
          {albumGrid(madeForYouAlbums, "sm")}
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
              {recentLabel(listenNowAlbums.length, libraryPath)}
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="relative">
          {listenNowAlbums.length
            ? albumGrid(listenNowAlbums, "lg")
            : albumGrid(albums.slice(0, 8), "lg")}
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
        <div className="relative">{albumGrid(madeForYouAlbums, "sm")}</div>
      </>
    );
  };

  return (
    <div className="flex h-[calc(100vh-40px)] min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 lg:px-8">
        <Heading
          title="Music Playstation"
          description="Play your local MP3 library."
          icon={Music}
          iconColor="text-green-700"
          otherProps="mb-4 shrink-0 px-0"
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t">
          <div className="flex min-h-0 flex-1 flex-col bg-background">
            <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-5">
              <div className="col-span-full flex min-h-0 flex-col overflow-hidden lg:col-span-4 lg:border-r">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-4 lg:px-6 lg:py-6">
                  <Tabs
                    value={tab}
                    onValueChange={(v) => {
                      setTab(v);
                      if (v === "music") setView("home");
                      if (v === "list") setView("songs");
                      if (v === "player") setView("player");
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
                className="hidden min-h-0 overflow-y-auto lg:block"
                onNavigate={onNavigate}
                onRadio={() => {
                  if (!tracks.length) {
                    toast({
                      title: "No music loaded",
                      description: "Add a music folder first.",
                    });
                    return;
                  }
                  playLibraryShuffled();
                  setView("player");
                  setTab("player");
                  toast({
                    title: "Radio started",
                    description: "Shuffling your library",
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <PlayerBar
        onOpenPlayer={() => {
          setTab("player");
          setView("player");
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
