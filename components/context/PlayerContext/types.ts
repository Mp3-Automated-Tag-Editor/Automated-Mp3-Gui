export type RepeatMode = "off" | "all" | "one";

export type Track = {
  id: string;
  file: string;
  artist: string;
  title: string;
  album: string;
  path: string;
  year: number;
  track: number;
  genre: string;
  comments: string;
  albumArtist: string;
  composer: string;
  discno: number;
  imageSrc: string;
  percentage: number;
  status: string;
  sessionName: string;
};

export type AlbumGroup = {
  name: string;
  artist: string;
  cover: string;
  tracks: Track[];
};

export type ArtistGroup = {
  name: string;
  tracks: Track[];
  albums: AlbumGroup[];
};

export type UserPlaylist = {
  id: string;
  name: string;
  trackPaths: string[];
};

export type MusicView =
  | "home"
  | "browse"
  | "songs"
  | "albums"
  | "artists"
  | "playlists"
  | "made-for-you"
  | "playlist"
  | "player";

export type PlayerContextState = {
  tracks: Track[];
  libraryPath: string | null;
  isLoading: boolean;
  error: string | null;
  queue: Track[];
  currentIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  likedPaths: string[];
  recentlyPlayed: string[];
  playlists: UserPlaylist[];
  loadFolder: (directory: string) => Promise<void>;
  playTrack: (track: Track, queue?: Track[]) => void;
  playAlbum: (tracks: Track[]) => void;
  playLibraryShuffled: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  playNext: (track: Track) => void;
  playLater: (track: Track) => void;
  playNextMany: (tracks: Track[]) => void;
  playLaterMany: (tracks: Track[]) => void;
  toggleLike: (track: Track) => void;
  isLiked: (path: string) => boolean;
  createPlaylist: (name: string, trackPaths?: string[]) => string;
  addToPlaylist: (playlistId: string, trackPaths: string[]) => void;
  getPlaylistTracks: (playlistId: string) => Track[];
  createStation: (seed: Track) => void;
  albums: AlbumGroup[];
  artists: ArtistGroup[];
  listenNowAlbums: AlbumGroup[];
  madeForYouAlbums: AlbumGroup[];
  likedTracks: Track[];
};
