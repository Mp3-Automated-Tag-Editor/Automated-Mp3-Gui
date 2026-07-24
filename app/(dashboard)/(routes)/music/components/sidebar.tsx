"use client";

import { AlignJustify, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MusicView, UserPlaylist } from "@/components/context/PlayerContext/types";

/** Same collapsed width as the primary app sidebar (`layout.tsx`). */
const COLLAPSED_WIDTH = "w-[4.25rem]";
const OPEN_WIDTH = "w-56 xl:w-64";

/**
 * Mirror `components/sidebar.tsx` navItemBase:
 * always left-aligned, always p-3, labels fade via opacity only.
 * Shell keeps px-3 open and closed so items stay inset buttons.
 */
const navItemBase =
  "flex w-full cursor-pointer items-center justify-start overflow-hidden whitespace-nowrap rounded-lg p-3 text-sm font-medium text-muted-foreground duration-300 hover:bg-accent hover:text-accent-foreground";

const navItemActive = "bg-accent text-accent-foreground";

/** Native scrollbar must not eat layout width in the collapsed rail. */
const hideScrollbar =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  playlists: UserPlaylist[];
  activeView: MusicView;
  activePlaylistId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (view: MusicView, playlistId?: string | null) => void;
  onRadio: () => void;
}

export function Sidebar({
  className,
  playlists,
  activeView,
  activePlaylistId,
  isOpen,
  onToggle,
  onNavigate,
  onRadio,
}: SidebarProps) {
  const labelClass = cn(
    "transition-opacity duration-300",
    isOpen ? "opacity-100" : "opacity-0"
  );

  const sectionTitle = (label: string) => (
    <h2
      className={cn(
        "mb-2 overflow-hidden whitespace-nowrap px-3 text-lg font-semibold tracking-tight transition-opacity duration-300",
        isOpen ? "opacity-100" : "pointer-events-none mb-0 h-0 opacity-0"
      )}
    >
      {label}
    </h2>
  );

  const iconSvg = (paths: React.ReactNode) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-3 h-5 w-5 shrink-0"
    >
      {paths}
    </svg>
  );

  const item = (
    view: MusicView,
    label: string,
    icon: React.ReactNode,
    playlistId?: string
  ) => {
    const active =
      playlistId != null
        ? activeView === "playlist" && activePlaylistId === playlistId
        : activeView === view ||
          (view === "albums" && activeView === "album-detail") ||
          (view === "artists" && activeView === "artist-detail");
    return (
      <button
        type="button"
        className={cn(navItemBase, active && navItemActive)}
        onClick={() => onNavigate(view, playlistId ?? null)}
        title={!isOpen ? label : undefined}
      >
        {icon}
        <span className={labelClass}>{label}</span>
      </button>
    );
  };

  const playlistButtons = playlists.map((playlist) => (
    <button
      key={playlist.id}
      type="button"
      className={cn(
        navItemBase,
        "font-normal",
        activeView === "playlist" &&
          activePlaylistId === playlist.id &&
          navItemActive
      )}
      onClick={() => onNavigate("playlist", playlist.id)}
      title={!isOpen ? playlist.name : undefined}
    >
      {iconSvg(
        <>
          <path d="M21 15V6" />
          <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M12 12H3" />
          <path d="M16 6H3" />
          <path d="M12 18H3" />
        </>
      )}
      <span className={labelClass}>{playlist.name}</span>
    </button>
  ));

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden border-l bg-background transition-[width] duration-300 ease-in-out",
        isOpen ? OPEN_WIDTH : COLLAPSED_WIDTH,
        className
      )}
    >
      {/*
        Always px-3. When collapsed, hide the scrollbar gutter — otherwise the
        nav column shrinks while the footer (no scrollbar) stays full width,
        making the toggle look end-to-end / mismatched with the icons above.
      */}
      <div
        className={cn(
          "min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 py-4",
          !isOpen && hideScrollbar
        )}
      >
        <div className="space-y-1">
          {sectionTitle("Discover")}
          {item(
            "home",
            "Listen Now",
            iconSvg(
              <>
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </>
            )
          )}
          {item(
            "browse",
            "Browse",
            iconSvg(
              <>
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </>
            )
          )}
          <button
            type="button"
            className={navItemBase}
            onClick={onRadio}
            title={!isOpen ? "Radio" : undefined}
          >
            {iconSvg(
              <>
                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
                <circle cx="12" cy="12" r="2" />
                <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
                <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
              </>
            )}
            <span className={labelClass}>Radio</span>
          </button>
        </div>

        <div className="space-y-1">
          {sectionTitle("Library")}
          {item(
            "playlists",
            "Playlists",
            iconSvg(
              <>
                <path d="M21 15V6" />
                <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                <path d="M12 12H3" />
                <path d="M16 6H3" />
                <path d="M12 18H3" />
              </>
            )
          )}
          {item(
            "songs",
            "Songs",
            iconSvg(
              <>
                <circle cx="8" cy="18" r="4" />
                <path d="M12 18V2l7 4" />
              </>
            )
          )}
          {item(
            "made-for-you",
            "Made for You",
            iconSvg(
              <>
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </>
            )
          )}
          {item(
            "artists",
            "Artists",
            iconSvg(
              <>
                <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
                <circle cx="17" cy="7" r="5" />
              </>
            )
          )}
          {item(
            "albums",
            "Albums",
            iconSvg(
              <>
                <path d="m16 6 4 14" />
                <path d="M12 6v14" />
                <path d="M8 8v12" />
                <path d="M4 4v16" />
              </>
            )
          )}
        </div>

        <div className="space-y-1">
          {sectionTitle("Playlists")}
          {/*
            Nested ScrollArea only when open. When collapsed it forces a second
            scrollbar / fixed height and fights the outer rail width.
          */}
          {isOpen ? (
            <ScrollArea className="h-[240px]">
              <div className="space-y-1">{playlistButtons}</div>
            </ScrollArea>
          ) : (
            <div className="space-y-1">{playlistButtons}</div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-3 py-2">
        <button
          type="button"
          className={cn(navItemBase, "overflow-hidden")}
          onClick={onToggle}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {!isOpen ? (
            <AlignJustify className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
          ) : (
            <X className="mr-3 h-5 w-5 shrink-0 text-red-700 dark:text-red-400" />
          )}
          <span className={labelClass}>Close Sidebar</span>
        </button>
      </div>
    </div>
  );
}
