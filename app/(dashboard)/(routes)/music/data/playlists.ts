import type { UserPlaylist } from "@/components/context/PlayerContext/types";

/** Built-in playlist names used before a library is loaded. */
export type Playlist = string;

export const playlists: Playlist[] = [
  "Liked Songs",
  "Recently Played",
];

export type { UserPlaylist };
