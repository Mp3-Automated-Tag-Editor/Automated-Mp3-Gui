"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { Heart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { usePlayer } from "@/components/context/PlayerContext";
import type { Track } from "@/components/context/PlayerContext/types";
import {
  displayAlbum,
  displayArtist,
  displayTitle,
  trackCoverSrc,
} from "@/components/context/PlayerContext/music-utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { CreatePlaylistDialog } from "./create-playlist-dialog";
import { LibrarySortSelect } from "./library-sort-select";
import {
  SONG_SORT_OPTIONS,
  sortSongs,
  type SongSortKey,
} from "./library-sort";

type SongListProps = {
  tracks: Track[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  /** When true, fills parent height instead of a fixed viewport calc */
  fillHeight?: boolean;
  /** External filter from the global music search bar */
  filterQuery?: string;
  showHeader?: boolean;
  onOpenAlbum?: (albumName: string, albumArtist: string) => void;
  onOpenArtist?: (artistName: string) => void;
  /** Controlled sort; when omitted, uses internal Title A–Z default */
  sortKey?: SongSortKey;
  onSortKeyChange?: (key: SongSortKey) => void;
  showSort?: boolean;
};

export function SongList({
  tracks,
  title,
  description,
  emptyMessage = "No songs yet. Add a music folder to get started.",
  fillHeight = true,
  filterQuery = "",
  showHeader = true,
  onOpenAlbum,
  onOpenArtist,
  sortKey: controlledSort,
  onSortKeyChange,
  showSort = false,
}: SongListProps) {
  const {
    playTrack,
    currentTrack,
    isPlaying,
    toggleLike,
    isLiked,
    playNext,
    playLater,
    createPlaylist,
    addToPlaylist,
    playlists,
  } = usePlayer();
  const { toast } = useToast();
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [pendingTrack, setPendingTrack] = useState<Track | null>(null);
  const [internalSort, setInternalSort] = useState<SongSortKey>("title-asc");
  const sortKey = controlledSort ?? internalSort;

  const filtered = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const list = !q
      ? tracks
      : tracks.filter((t) => {
          const hay =
            `${displayTitle(t)} ${displayArtist(t)} ${displayAlbum(t)}`.toLowerCase();
          return hay.includes(q);
        });
    return sortSongs(list, sortKey);
  }, [tracks, filterQuery, sortKey]);

  const handleSortChange = (value: string) => {
    const next = value as SongSortKey;
    if (onSortKeyChange) onSortKeyChange(next);
    else setInternalSort(next);
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-3",
        fillHeight && "h-full"
      )}
    >
      {showHeader && (title || description || showSort) ? (
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {title ? (
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {showSort ? (
            <LibrarySortSelect
              value={sortKey}
              options={SONG_SORT_OPTIONS}
              onValueChange={handleSortChange}
            />
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          "min-h-0 rounded-md border",
          fillHeight ? "flex-1" : "h-[28rem] sm:h-[30rem]"
        )}
      >
        <ScrollArea className="h-full">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground sm:p-6">
              {emptyMessage}
            </p>
          ) : (
            <div className="divide-y">
              {filtered.map((track) => {
                const active = currentTrack?.path === track.path;
                const liked = isLiked(track.path);
                return (
                  <ContextMenu key={track.path}>
                    <ContextMenuTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 sm:gap-3 sm:px-3 sm:py-2 hover:bg-accent/60",
                          active && "bg-accent"
                        )}
                      >
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-2 text-left sm:gap-3"
                          onClick={() => playTrack(track, tracks)}
                        >
                          <Image
                            src={trackCoverSrc(track)}
                            alt=""
                            width={40}
                            height={40}
                            unoptimized
                            className="h-9 w-9 shrink-0 rounded object-cover sm:h-10 sm:w-10"
                          />
                          <span className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {displayTitle(track)}
                              {active && isPlaying ? " · Playing" : ""}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {displayArtist(track)} — {displayAlbum(track)}
                            </p>
                          </span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => toggleLike(track)}
                          title="Like"
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4",
                              liked && "fill-red-500 text-red-500"
                            )}
                          />
                        </Button>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-52">
                      <ContextMenuItem
                        onClick={() => {
                          toggleLike(track);
                          toast({
                            title: liked
                              ? "Removed from Liked Songs"
                              : "Added to Liked Songs",
                          });
                        }}
                      >
                        {liked ? "Unlike" : "Like"}
                      </ContextMenuItem>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          Add to Playlist
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-48">
                          <ContextMenuItem
                            onClick={() => {
                              setPendingTrack(track);
                              setPlaylistDialogOpen(true);
                            }}
                          >
                            <PlusCircledIcon className="mr-2 h-4 w-4" />
                            New Playlist
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          {playlists.map((playlist) => (
                            <ContextMenuItem
                              key={playlist.id}
                              onClick={() => {
                                addToPlaylist(playlist.id, [track.path]);
                                toast({
                                  title: "Added to playlist",
                                  description: playlist.name,
                                });
                              }}
                            >
                              {playlist.name}
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => playNext(track)}>
                        Play Next
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => playLater(track)}>
                        Add to Queue
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() =>
                          onOpenAlbum?.(
                            displayAlbum(track),
                            displayArtist(track)
                          )
                        }
                      >
                        Go to Album
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => onOpenArtist?.(displayArtist(track))}
                      >
                        Go to Artist
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <CreatePlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        defaultName={
          pendingTrack ? displayAlbum(pendingTrack) : ""
        }
        onConfirm={(name) => {
          if (!pendingTrack) return;
          createPlaylist(name, [pendingTrack.path]);
          toast({ title: "Playlist created", description: name });
          setPendingTrack(null);
        }}
      />
    </div>
  );
}
