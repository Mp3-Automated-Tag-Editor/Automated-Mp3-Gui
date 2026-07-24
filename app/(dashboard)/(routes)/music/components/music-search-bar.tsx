"use client";

import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SearchScope =
  | "all"
  | "artists"
  | "albums"
  | "songs"
  | "playlists"
  | "queue";

const SCOPE_LABELS: Record<Exclude<SearchScope, "all">, string> = {
  artists: "Artists",
  albums: "Albums",
  songs: "Songs",
  playlists: "Playlists",
  queue: "Queue",
};

const SLASH_COMMANDS: { cmd: string; scope: Exclude<SearchScope, "all"> }[] = [
  { cmd: "/artists", scope: "artists" },
  { cmd: "/albums", scope: "albums" },
  { cmd: "/songs", scope: "songs" },
  { cmd: "/playlists", scope: "playlists" },
  { cmd: "/queue", scope: "queue" },
];

export function parseSearchInput(raw: string): {
  scope: SearchScope | null;
  query: string;
} {
  const trimmed = raw.trimStart();
  for (const { cmd, scope } of SLASH_COMMANDS) {
    if (trimmed.toLowerCase().startsWith(cmd)) {
      const rest = trimmed.slice(cmd.length);
      if (rest === "" || rest.startsWith(" ")) {
        return { scope, query: rest.trimStart() };
      }
    }
  }
  return { scope: null, query: raw };
}

export function scopePlaceholder(scope: SearchScope): string {
  switch (scope) {
    case "artists":
      return "Search artists…";
    case "albums":
      return "Search albums…";
    case "songs":
      return "Search songs…";
    case "playlists":
      return "Search playlists…";
    case "queue":
      return "Search queue…";
    default:
      return "Search albums, artists, songs…";
  }
}

type MusicSearchBarProps = {
  value: string;
  scope: SearchScope;
  onValueChange: (value: string) => void;
  onScopeChange: (scope: SearchScope) => void;
  className?: string;
};

export function MusicSearchBar({
  value,
  scope,
  onValueChange,
  onScopeChange,
  className,
}: MusicSearchBarProps) {
  const handleChange = (raw: string) => {
    const parsed = parseSearchInput(raw);
    if (parsed.scope) {
      onScopeChange(parsed.scope);
      onValueChange(parsed.query);
      return;
    }
    onValueChange(raw);
  };

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-input bg-background px-2 transition-colors focus-within:border-ring",
        className
      )}
    >
      {scope !== "all" && (
        <Badge
          variant="secondary"
          className="flex shrink-0 items-center gap-1 py-0.5 pl-2 pr-1 font-normal focus:ring-0 focus:ring-offset-0"
        >
          {SCOPE_LABELS[scope]}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-4 rounded-full p-0 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-muted-foreground/20"
            onClick={() => onScopeChange("all")}
            title="Clear search context"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear context</span>
          </Button>
        </Badge>
      )}
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={scopePlaceholder(scope)}
        className="h-9 flex-1 border-0 bg-transparent px-1 shadow-none outline-none ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}

/** Map a music view to the default search balloon scope. */
export function scopeForView(
  view: string,
  tab?: string
): SearchScope {
  if (tab === "player" || view === "player") return "queue";
  switch (view) {
    case "artists":
    case "artist-detail":
      return "artists";
    case "albums":
    case "browse":
    case "album-detail":
      return "albums";
    case "songs":
    case "playlist":
    case "made-for-you":
      return "songs";
    case "playlists":
      return "playlists";
    default:
      return "all";
  }
}
