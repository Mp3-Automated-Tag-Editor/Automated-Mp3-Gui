import { Download, AudioLines, Music, BarChartHorizontalIcon, Pencil, Play, Settings2, LayoutDashboard } from "lucide-react";
import { CheckCircledIcon, CrossCircledIcon, StopwatchIcon } from "@radix-ui/react-icons";

export const MAX_FREE_SONGS = 100;

// ---------------------------------------------------------------------------
// Persistence (tauri-plugin-store)
// ---------------------------------------------------------------------------

export const STORE_FILE = ".settings.dat";

export const STORE_KEYS = {
  settings: "settings",
  musicPlayer: "musicPlayer",
  pendingSuggestions: "pendingSuggestions",
} as const;

export const CONFIG_KEYS = {
  libraryPath: "libraryPath",
  scrapeMode: "scrapeMode",
  threads: "threads",
  developerSettings: "developerSettings",
  darkSidebar: "darkSidebar",
} as const;

export const SCRAPE_MODE = {
  review: "review",
  apply: "apply",
} as const;

export type ScrapeMode = (typeof SCRAPE_MODE)[keyof typeof SCRAPE_MODE];

/** Default settings blob written on first launch. */
export const DEFAULT_SETTINGS: Record<string, unknown> = {
  test: "test",
  threads: 1,
  developerSettings: false,
  darkSidebar: false,
  useCache: true,
  spotify: true,
  palm: true,
  ytmusic: true,
  itunes: true,
  genius: true,
  groq: true,
  deepseekR1: false,
  amazonMusic: false,
  appleMusic: false,
  theAudioDb: false,
  deezer: false,
  musicBrainz: false,
  echonest: false,
  pandora: false,
  soundCloud: false,
  tidal: false,
  napster: false,
  qobuz: false,
  qqMusic: false,
  yandexMusic: false,
  vkMusic: false,
  anghami: false,
  zvuk: false,
  gaana: false,
  jiosaavn: false,
  resso: false,
  boomplay: false,
  wikipedia: false,
  googleSearch: false,
  libraryPath: "",
  scrapeMode: SCRAPE_MODE.review,
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  download: "/download",
  stream: "/stream",
  edit: "/edit",
  editPage: "/edit/editPage",
  editIncomplete: "/edit?filter=incomplete",
  music: "/music",
  stats: "/stats",
  settings: "/settings",
  settingsAccount: "/settings/account",
  settingsAppearance: "/settings/appearance",
  settingsNotifications: "/settings/notifications",
  settingsDev: "/settings/dev",
  aboutUs: "/about-us",
  terminal: "/terminal",
  start: "/start",
} as const;

export const QUERY = {
  incompleteFilter: "incomplete",
} as const;

// ---------------------------------------------------------------------------
// Domain: song status / completeness
// ---------------------------------------------------------------------------

export const SONG_STATUS = {
  saved: "SAVED",
  unsaved: "UNSAVED",
  edit: "EDIT",
} as const;

/** Tracks at or below this metadata % are treated as incomplete. */
export const INCOMPLETE_PERCENTAGE_MAX = 40;

export const COMPLETION_BADGE = {
  high: 70,
  mid: 50,
  low: 30,
} as const;

export const EMPTY_TAG = "None";

/** Edit-table status filter options (value matches `SONG_STATUS`). */
export const statuses = [
  {
    value: SONG_STATUS.edit,
    label: "Edit",
    icon: StopwatchIcon,
    color: "yellow",
  },
  {
    value: SONG_STATUS.saved,
    label: "Saved",
    icon: CheckCircledIcon,
    color: "green",
  },
  {
    value: SONG_STATUS.unsaved,
    label: "Unsaved",
    icon: CrossCircledIcon,
    color: "red",
  },
];

/** Edit-table genre filter options. */
export const genres = [
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "rb", label: "R&B" },
  { value: "blues", label: "Blues" },
  { value: "soul", label: "Soul" },
  { value: "reggae", label: "Reggae" },
  { value: "funk", label: "Funk" },
  { value: "folk", label: "Folk" },
  { value: "country", label: "Country" },
  { value: "jazz", label: "Jazz" },
  { value: "disco", label: "Disco" },
  { value: "classic", label: "Classic" },
  { value: "edm", label: "EDM" },
  { value: "gospel", label: "Gospel" },
  { value: "metal", label: "Metal" },
  { value: "contemporary", label: "Contemporary" },
];

// ---------------------------------------------------------------------------
// Tauri IPC — keep in sync with src-tauri command / event names
// ---------------------------------------------------------------------------

export const TAURI_EVENTS = {
  progressStart: "progress_start",
  progressEnd: "progress_end",
  scrapeResult: "scrape_result",
  scrapeSongResult: "scrape_song_result",
  errorEnv: "error_env",
  dbInitPaths: "db_init_paths",
  downloadProgress: "download_progress",
  downloadFinished: "download_finished",
  artistCountryProgress: "artist_country_progress",
  mediaPrev: "media-prev",
  mediaToggle: "media-toggle",
  mediaNext: "media-next",
} as const;

export const TAURI_COMMANDS = {
  readMusicDirectory: "read_music_directory",
  updateMusicFile: "update_music_file",
  scrapeLibraryPaths: "scrape_library_paths",
  stopScrapeProcess: "stop_scrape_process",
  startScrapeProcess: "start_scrape_process",
  initializeDb: "initialize_db",
  checkDirectory: "check_directory",
  saveSettings: "save_settings",
  getServerHealth: "get_server_health",
  getNetworkData: "get_network_data",
  downloadMusic: "download_music",
  stopDownloadMusic: "stop_download_music",
  checkDownloadDeps: "check_download_deps",
  computeLibraryStats: "compute_library_stats",
  lookupArtistCountry: "lookup_artist_country",
  resolveArtistCountries: "resolve_artist_countries",
  fetchAlbumArtUrl: "fetch_album_art_url",
  setAlbumArt: "set_album_art",
  setTaskbarPlaybackState: "set_taskbar_playback_state",
} as const;

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

export const DOWNLOAD = {
  defaultBitrate: 320,
  bitrates: [128, 192, 256, 320] as const,
  backendSpotdl: "spotdl",
  backendYtdlp: "yt-dlp",
  spotifyHost: "open.spotify.com",
  spotifyScheme: "spotify:",
  logCap: 400,
} as const;

// ---------------------------------------------------------------------------
// Music player
// ---------------------------------------------------------------------------

export const DEFAULT_COVER = "/def-album-art.png";

export const PLAYER = {
  likedPlaylistId: "liked-songs",
  recentPlaylistId: "recently-played",
  recentLimit: 50,
  defaultVolume: 0.8,
  musicSidebarOpenKey: "musicSidebarOpen",
} as const;

// ---------------------------------------------------------------------------
// Stats / geo
// ---------------------------------------------------------------------------

export const GEO = {
  countriesTopojson: "/geo/countries-110m.json",
} as const;

export const STATS = {
  genreLimit: 8,
  artistLimit: 10,
  scrapeLogCap: 200,
} as const;

export const GENRE_PIE_PALETTE = [
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
  "#94a3b8",
] as const;

export type StatsMapPalette = {
  ocean: string;
  empty: string;
  stroke: string;
  hoverEmpty: string;
  selected: string;
  selectedHover: string;
  heat: string[];
  heatHover: string;
};

export const STATS_MAP_PALETTE_LIGHT: StatsMapPalette = {
  ocean: "#e8eef4",
  empty: "#c3ced9",
  stroke: "#94a3b8",
  hoverEmpty: "#a8b6c4",
  selected: "#d97706",
  selectedHover: "#f59e0b",
  heat: ["#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7", "#0369a1"],
  heatHover: "#67e8f9",
};

export const STATS_MAP_PALETTE_DARK: StatsMapPalette = {
  ocean: "#0f172a",
  empty: "#1e293b",
  stroke: "#334155",
  hoverEmpty: "#334155",
  selected: "#f59e0b",
  selectedHover: "#fbbf24",
  heat: ["#0e7490", "#0891b2", "#06b6d4", "#22d3ee", "#67e8f9"],
  heatHover: "#a5f3fc",
};

/** Input shape for highlight cards (matches library highlights payload). */
export type HighlightCardSource = {
  topArtist: string | null;
  topArtistCount: number;
  dominantGenre: string | null;
  dominantGenreCount: number;
  oldestYear: number | null;
  newestYear: number | null;
  likedCount: number;
  recentTitle: string | null;
  recentArtist: string | null;
};

export function buildHighlightCards(highlights: HighlightCardSource) {
  return [
    {
      label: "Top artist",
      value: highlights.topArtist ?? "—",
      hint: highlights.topArtist
        ? `${highlights.topArtistCount} tracks in your library`
        : "Add music to see this",
    },
    {
      label: "Dominant genre",
      value: highlights.dominantGenre ?? "—",
      hint: highlights.dominantGenre
        ? `${highlights.dominantGenreCount} tracks`
        : "Genres appear from tags",
    },
    {
      label: "Oldest year",
      value: highlights.oldestYear?.toString() ?? "—",
      hint: "Earliest release year tagged",
    },
    {
      label: "Newest year",
      value: highlights.newestYear?.toString() ?? "—",
      hint: "Latest release year tagged",
    },
    {
      label: "Liked songs",
      value: highlights.likedCount.toString(),
      hint: "From your Liked Songs playlist",
    },
    {
      label: "Recently played",
      value: highlights.recentTitle ?? "—",
      hint: highlights.recentArtist
        ? highlights.recentArtist
        : "Play something to populate this",
    },
  ];
}

export const TABLE = {
  defaultPageSize: 10,
  pageSizes: [10, 20, 30, 40, 50, 100] as const,
} as const;

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

export const TEAM = [
  {
    name: "Jonathan Rufus Samuel",
    role: "DevOps & Infrastructure Software Engineer",
    org: "CERN",
  },
  {
    name: "Shivansh Sahai",
    role: "SDE 1",
    org: "HSBC",
  },
  {
    name: "Swarnlatha P",
    role: "Advisor · Senior Professor",
    org: "VIT Vellore",
  },
] as const;

// ---------------------------------------------------------------------------
// Navigation / dashboard cards
// ---------------------------------------------------------------------------

export const tools = [
  {
    label: "Start Scraping",
    icon: Play,
    href: ROUTES.editIncomplete,
    color: "text-violet-500",
    // bgColor: "bg-violet-500/10",
  },
  {
    label: "Download",
    icon: Download,
    color: "text-pink-700",
    href: ROUTES.download,
    bgColor: "bg-pink-700/10",
  },
  {
    label: "Stream & Connect",
    icon: AudioLines,
    color: "text-blue-700",
    href: ROUTES.stream,
    bgColor: "bg-blue-700/10",
  },
  {
    label: "Edit",
    icon: Pencil,
    color: "text-orange-700",
    href: ROUTES.edit,
    bgColor: "bg-orange-700/10",
  },
  {
    label: "Music Playstation",
    icon: Music,
    color: "text-green-700",
    bgColor: "bg-green-700/10",
    href: ROUTES.music,
  },
  {
    label: "Statistics",
    icon: BarChartHorizontalIcon,
    color: "text-yellow-700",
    bgColor: "bg-yellow-700/10",
    href: ROUTES.stats,
  },
  {
    label: "Settings",
    icon: Settings2,
    color: "text-grey-500",
    bgColor: "bg-grey-500/10",
    href: ROUTES.settings,
  },
];

/** Primary sidebar links (Dashboard + tools without Settings). */
export const sidebarRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: ROUTES.dashboard,
    color: "text-sky-500",
  },
  ...tools.filter((t) => t.href !== ROUTES.settings),
];

/** Settings secondary nav (Developer item appended when enabled). */
export const settingsNavItems = [
  { title: "General", href: ROUTES.settings },
  { title: "Account", href: ROUTES.settingsAccount },
  { title: "Appearance", href: ROUTES.settingsAppearance },
  { title: "Notifications", href: ROUTES.settingsNotifications },
];

export const settingsDevNavItem = {
  title: "Developer",
  href: ROUTES.settingsDev,
};

export const proTools = [
  {
    label: "DeepScrape Pro",
    icon: Play,
    href: ROUTES.editIncomplete,
    color: "text-violet-500",
    content: "Unlimited DeepScrape Support",
  },
  {
    label: "Pro Downloads",
    icon: Download,
    color: "text-pink-700",
    href: ROUTES.download,
    bgColor: "bg-pink-700/10",
    content: "Unlimited Download Support",
  },
];
