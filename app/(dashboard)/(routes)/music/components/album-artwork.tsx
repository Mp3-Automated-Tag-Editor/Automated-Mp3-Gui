"use client";

import { useState } from "react";
import Image from "next/image";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
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
import type { AlbumGroup } from "@/components/context/PlayerContext/types";
import { useFullCover } from "@/components/context/PlayerContext/use-full-cover";
import { DEFAULT_COVER } from "@/constants";
import { useToast } from "@/components/ui/use-toast";
import { CreatePlaylistDialog } from "./create-playlist-dialog";

interface AlbumArtworkProps extends React.HTMLAttributes<HTMLDivElement> {
  album: AlbumGroup;
  aspectRatio?: "portrait" | "square";
  width?: number;
  height?: number;
  /** Left-click opens album detail (required — play via context menu / detail) */
  onOpenAlbum: () => void;
}

export function AlbumArtwork({
  album,
  aspectRatio = "portrait",
  width,
  height,
  className,
  onOpenAlbum,
  ...props
}: AlbumArtworkProps) {
  const {
    playAlbum,
    playNextMany,
    playLaterMany,
    createStation,
    toggleLike,
    createPlaylist,
    addToPlaylist,
    playlists,
    libraryPath,
  } = usePlayer();
  const { toast } = useToast();
  const seed = album.tracks[0];
  const { src: coverSrc } = useFullCover(seed);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  return (
    <div className={cn("space-y-3", className)} {...props}>
      <ContextMenu>
        <ContextMenuTrigger>
          <button
            type="button"
            className="overflow-hidden rounded-md text-left"
            onClick={onOpenAlbum}
          >
            <Image
              src={coverSrc || album.cover || DEFAULT_COVER}
              alt={album.name}
              width={width}
              height={height}
              unoptimized
              className={cn(
                "h-auto w-auto object-cover transition-all hover:scale-105",
                aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square"
              )}
            />
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={() =>
              toast({
                title: "Already in library",
                description: libraryPath
                  ? `Tracks from “${album.name}” are part of your loaded folder.`
                  : "Add a music folder first.",
              })
            }
          >
            Add to Library
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Add to Playlist</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem onClick={() => setPlaylistDialogOpen(true)}>
                <PlusCircledIcon className="mr-2 h-4 w-4" />
                New Playlist
              </ContextMenuItem>
              <ContextMenuSeparator />
              {playlists.map((playlist) => (
                <ContextMenuItem
                  key={playlist.id}
                  onClick={() => {
                    addToPlaylist(
                      playlist.id,
                      album.tracks.map((t) => t.path)
                    );
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
          <ContextMenuItem onClick={() => playAlbum(album.tracks)}>
            Play
          </ContextMenuItem>
          <ContextMenuItem onClick={() => playNextMany(album.tracks)}>
            Play Next
          </ContextMenuItem>
          <ContextMenuItem onClick={() => playLaterMany(album.tracks)}>
            Add to Queue
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              if (seed) createStation(seed);
            }}
          >
            Create Station
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              if (!seed) return;
              toggleLike(seed);
              toast({ title: "Updated Liked Songs" });
            }}
          >
            Like
          </ContextMenuItem>
          <ContextMenuItem
            onClick={async () => {
              const text = seed?.path || libraryPath || album.name;
              try {
                await navigator.clipboard.writeText(text);
                toast({ title: "Copied path", description: text });
              } catch {
                toast({
                  title: "Could not copy",
                  description: text,
                  variant: "destructive",
                });
              }
            }}
          >
            Share
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <button
        type="button"
        className="space-y-1 text-left text-sm"
        onClick={onOpenAlbum}
      >
        <h3 className="font-medium leading-none hover:underline">
          {album.name}
        </h3>
        <p className="text-xs text-muted-foreground">{album.artist}</p>
      </button>

      <CreatePlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        defaultName={album.name}
        onConfirm={(name) => {
          createPlaylist(
            name,
            album.tracks.map((t) => t.path)
          );
          toast({ title: "Playlist created", description: name });
        }}
      />
    </div>
  );
}
