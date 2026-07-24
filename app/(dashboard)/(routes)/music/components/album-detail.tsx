"use client";

import Image from "next/image";
import { ArrowLeft, Play, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePlayer } from "@/components/context/PlayerContext";
import type { AlbumGroup } from "@/components/context/PlayerContext/types";
import { SongList } from "./song-list";

type AlbumDetailProps = {
  album: AlbumGroup;
  filterQuery?: string;
  onBack: () => void;
  onOpenArtist?: (artistName: string) => void;
  onOpenAlbum?: (albumName: string, albumArtist: string) => void;
};

export function AlbumDetail({
  album,
  filterQuery = "",
  onBack,
  onOpenArtist,
  onOpenAlbum,
}: AlbumDetailProps) {
  const { playAlbum } = usePlayer();

  const playShuffled = () => {
    const shuffled = [...album.tracks].sort(() => Math.random() - 0.5);
    playAlbum(shuffled);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5 px-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end">
        <Image
          src={album.cover}
          alt={album.name}
          width={180}
          height={180}
          unoptimized
          className="h-40 w-40 shrink-0 rounded-md object-cover shadow-md sm:h-44 sm:w-44"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Album
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {album.name}
          </h2>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => onOpenArtist?.(album.artist)}
          >
            {album.artist}
          </button>
          <p className="text-xs text-muted-foreground">
            {album.tracks.length} songs
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={() => playAlbum(album.tracks)}
              disabled={!album.tracks.length}
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              Play
            </Button>
            <Button
              variant="outline"
              onClick={playShuffled}
              disabled={!album.tracks.length}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Shuffle
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="min-h-0 flex-1">
        <SongList
          tracks={album.tracks}
          filterQuery={filterQuery}
          emptyMessage="No songs in this album."
          showHeader={false}
          onOpenArtist={onOpenArtist}
          onOpenAlbum={onOpenAlbum}
        />
      </div>
    </div>
  );
}
