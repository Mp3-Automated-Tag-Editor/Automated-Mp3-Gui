"use client";

import { ArrowLeft, Play, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePlayer } from "@/components/context/PlayerContext";
import type { ArtistGroup } from "@/components/context/PlayerContext/types";
import { AlbumArtwork } from "./album-artwork";
import { SongList } from "./song-list";

type ArtistDetailProps = {
  artist: ArtistGroup;
  filterQuery?: string;
  onBack: () => void;
  onOpenAlbum: (albumName: string, albumArtist: string) => void;
  onOpenArtist?: (artistName: string) => void;
};

export function ArtistDetail({
  artist,
  filterQuery = "",
  onBack,
  onOpenAlbum,
  onOpenArtist,
}: ArtistDetailProps) {
  const { playAlbum } = usePlayer();

  const playAll = () => {
    if (artist.tracks.length) playAlbum(artist.tracks);
  };

  const playShuffled = () => {
    const shuffled = [...artist.tracks].sort(() => Math.random() - 0.5);
    playAlbum(shuffled);
  };

  const q = filterQuery.trim().toLowerCase();
  const filteredAlbums = q
    ? artist.albums.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.artist.toLowerCase().includes(q)
      )
    : artist.albums;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit shrink-0 gap-1.5 px-2"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="shrink-0 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Artist
        </p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {artist.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {artist.tracks.length} songs · {artist.albums.length} albums
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={playAll} disabled={!artist.tracks.length}>
            <Play className="mr-2 h-4 w-4 fill-current" />
            Play all
          </Button>
          <Button
            variant="outline"
            onClick={playShuffled}
            disabled={!artist.tracks.length}
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle
          </Button>
        </div>
      </div>

      {filteredAlbums.length > 0 && (
        <>
          <div className="shrink-0 space-y-1">
            <h3 className="text-lg font-medium">Albums</h3>
          </div>
          <ScrollArea className="shrink-0 w-full whitespace-nowrap">
            <div className="flex space-x-4 pb-4">
              {filteredAlbums.map((album) => (
                <AlbumArtwork
                  key={`${album.name}-${album.artist}`}
                  album={album}
                  className="w-[150px]"
                  aspectRatio="square"
                  width={150}
                  height={150}
                  onOpenAlbum={() => onOpenAlbum(album.name, album.artist)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <Separator />
        </>
      )}

      <div className="min-h-0 flex-1">
        <SongList
          tracks={artist.tracks}
          title="Songs"
          description={`${artist.tracks.length} tracks`}
          filterQuery={filterQuery}
          emptyMessage="No songs for this artist."
          onOpenAlbum={onOpenAlbum}
          onOpenArtist={onOpenArtist}
        />
      </div>
    </div>
  );
}
