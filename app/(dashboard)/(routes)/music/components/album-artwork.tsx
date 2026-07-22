"use client";

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
import { useToast } from "@/components/ui/use-toast";

interface AlbumArtworkProps extends React.HTMLAttributes<HTMLDivElement> {
  album: AlbumGroup;
  aspectRatio?: "portrait" | "square";
  width?: number;
  height?: number;
}

export function AlbumArtwork({
  album,
  aspectRatio = "portrait",
  width,
  height,
  className,
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

  return (
    <div className={cn("space-y-3", className)} {...props}>
      <ContextMenu>
        <ContextMenuTrigger>
          <button
            type="button"
            className="overflow-hidden rounded-md text-left"
            onClick={() => playAlbum(album.tracks)}
          >
            <Image
              src={album.cover}
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
              <ContextMenuItem
                onClick={() => {
                  const name = window.prompt("New playlist name", album.name);
                  if (!name?.trim()) return;
                  createPlaylist(
                    name.trim(),
                    album.tracks.map((t) => t.path)
                  );
                  toast({ title: "Playlist created", description: name.trim() });
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
          <ContextMenuItem onClick={() => playNextMany(album.tracks)}>
            Play Next
          </ContextMenuItem>
          <ContextMenuItem onClick={() => playLaterMany(album.tracks)}>
            Play Later
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
      <div className="space-y-1 text-sm">
        <h3 className="font-medium leading-none">{album.name}</h3>
        <p className="text-xs text-muted-foreground">{album.artist}</p>
      </div>
    </div>
  );
}
