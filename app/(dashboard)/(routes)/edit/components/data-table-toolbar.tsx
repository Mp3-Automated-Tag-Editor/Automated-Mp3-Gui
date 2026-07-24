"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import {
  ChevronDown,
  Loader2,
  ScrollText,
  Sparkles,
  Square,
} from "lucide-react";
import { useContext } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableViewOptions } from "@/app/(dashboard)/(routes)/edit/components/data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { ConfigContext } from "@/components/context/ConfigContext";
import { cn } from "@/lib/utils";
import { CONFIG_KEYS, SCRAPE_MODE, genres, statuses, type ScrapeMode } from "@/constants";

export type ScrapeProgressState = {
  running: boolean;
  total: number;
  done: number;
  current?: string;
};

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  directory: string;
  scrapeProgress: ScrapeProgressState;
  logsOpen: boolean;
  onToggleLogs: () => void;
  onStartScrape: () => void;
  onStopScrape: () => void;
  scrapeMode: ScrapeMode;
  onScrapeModeChange: (mode: ScrapeMode) => void;
}

export function DataTableToolbar<TData>({
  table,
  scrapeProgress,
  logsOpen,
  onToggleLogs,
  onStartScrape,
  onStopScrape,
  scrapeMode,
  onScrapeModeChange,
}: DataTableToolbarProps<TData>) {
  const { configs, addConfig } = useContext(ConfigContext);
  const isFiltered = table.getState().columnFilters.length > 0;
  const left = Math.max(0, scrapeProgress.total - scrapeProgress.done);
  const pct =
    scrapeProgress.total > 0
      ? Math.round((scrapeProgress.done / scrapeProgress.total) * 100)
      : 0;

  const setMode = (mode: ScrapeMode) => {
    onScrapeModeChange(mode);
    addConfig(configs, { key: CONFIG_KEYS.scrapeMode, value: mode });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search Songs"
        value={
          ((table.getColumn("title")?.getFilterValue() as string) || "") ?? ""
        }
        onChange={(event) => {
          table.getColumn("title")?.setFilterValue(event.target.value);
        }}
        className="h-8 w-[140px] lg:w-[200px]"
      />
      {table.getColumn("status") && (
        <DataTableFacetedFilter
          column={table.getColumn("status")}
          title="Status"
          options={statuses}
        />
      )}
      {table.getColumn("genre") && (
        <DataTableFacetedFilter
          column={table.getColumn("genre")}
          title="Genre"
          options={genres}
        />
      )}
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <Cross2Icon className="ml-2 h-4 w-4" />
        </Button>
      )}

      {/* Progress — after Genre filters */}
      <div
        className={cn(
          "flex min-w-[160px] max-w-[280px] flex-1 items-center gap-2",
          !scrapeProgress.running && scrapeProgress.total === 0 && "opacity-40"
        )}
      >
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {scrapeProgress.running || scrapeProgress.total > 0
            ? `${left} left`
            : "—"}
        </span>
        <Progress value={pct} className="h-2 flex-1" indicatorColor="bg-primary" />
        {scrapeProgress.running ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <Button
        variant={logsOpen ? "secondary" : "outline"}
        size="sm"
        className="h-8"
        onClick={onToggleLogs}
      >
        <ScrollText className="mr-1.5 h-3.5 w-3.5" />
        Logs
      </Button>

      <DataTableViewOptions table={table} />

      <div className="flex items-center">
        <Button
          size="sm"
          className="h-8 rounded-r-none"
          disabled={scrapeProgress.running}
          onClick={onStartScrape}
        >
          Start scrape
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="default"
              className="h-8 rounded-l-none border-l border-primary-foreground/20 px-2"
              disabled={scrapeProgress.running}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>After scrape</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={scrapeMode}
              onValueChange={(v) => setMode(v as ScrapeMode)}
            >
              <DropdownMenuRadioItem value={SCRAPE_MODE.review}>
                Review suggestions
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={SCRAPE_MODE.apply}>
                Apply tags immediately
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {scrapeProgress.running ? (
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={onStopScrape}
        >
          <Square className="mr-1.5 h-3 w-3" />
          Stop
        </Button>
      ) : null}

      <Button size="sm" className="h-8" disabled title="Coming soon">
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        AI suggestions
      </Button>
    </div>
  );
}
