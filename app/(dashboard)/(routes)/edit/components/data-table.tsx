"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "../components/data-table-pagination";
import {
  DataTableToolbar,
  type ScrapeProgressState,
} from "../components/data-table-toolbar";
import { Song } from "../data/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PendingSuggestion } from "../lib/pending-suggestions";
import {
  COMPLETION_BADGE,
  QUERY,
  type ScrapeMode,
} from "@/constants";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalSongs: number;
  functions: any;
  directory: string;
  scrapeProgress: ScrapeProgressState;
  logs: string[];
  logsOpen: boolean;
  onToggleLogs: () => void;
  onStartScrape: (selectedPaths: string[]) => void;
  onStopScrape: () => void;
  scrapeMode: ScrapeMode;
  onScrapeModeChange: (mode: ScrapeMode) => void;
  pendingByPath: Record<string, PendingSuggestion>;
  scrapingPaths: Set<string>;
  defaultIncompleteFilter?: boolean;
}

export function DataTable({
  columns,
  data,
  totalSongs,
  functions,
  directory,
  scrapeProgress,
  logs,
  logsOpen,
  onToggleLogs,
  onStartScrape,
  onStopScrape,
  scrapeMode,
  onScrapeModeChange,
  pendingByPath,
  scrapingPaths,
  defaultIncompleteFilter = false,
}: DataTableProps<Song, unknown>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    defaultIncompleteFilter
      ? [{ id: "percentage", value: QUERY.incompleteFilter }]
      : []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowId: (row, index) => row.path || String(row.id) || String(index),
    meta: {
      handleSongUpdate: (
        filePath: string,
        updatedSong: Song,
        coverImagePath?: string | null
      ) => functions.updateSong(filePath, updatedSong, coverImagePath),
      syncSongLocal: (filePath: string, updatedSong: Song) =>
        functions.syncSongLocal?.(filePath, updatedSong),
      dismissPending: (path: string) => functions.dismissPending(path),
      pendingByPath,
      scrapingPaths,
    },
  });

  const handleStart = () => {
    const selected = table
      .getSelectedRowModel()
      .rows.map((r) => r.original.path)
      .filter(Boolean);
    onStartScrape(selected);
  };

  return (
    <div className={cn("flex gap-3", logsOpen && "items-stretch")}>
      <div className="min-w-0 flex-1 space-y-4">
        <DataTableToolbar
          table={table}
          directory={directory}
          scrapeProgress={scrapeProgress}
          logsOpen={logsOpen}
          onToggleLogs={onToggleLogs}
          onStartScrape={handleStart}
          onStopScrape={onStopScrape}
          scrapeMode={scrapeMode}
          onScrapeModeChange={onScrapeModeChange}
        />
        <div className="relative overflow-auto rounded-md border lg:h-[66vh] xl:h-[76vh]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const song = row.original;
                  const pending = !!pendingByPath[song.path];
                  const scraping = scrapingPaths.has(song.path);
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "hover:bg-muted/50",
                        scraping && "bg-amber-500/5",
                        pending && "bg-sky-500/5"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {cell.column.id === "percentage" ? (
                            <div className="flex items-center gap-1.5">
                              <Badge
                                className={cn(
                                  "border",
                                  song.percentage >= COMPLETION_BADGE.high
                                    ? "border-green-500"
                                    : song.percentage >= COMPLETION_BADGE.mid
                                      ? "border-yellow-500"
                                      : song.percentage >= COMPLETION_BADGE.low
                                        ? "border-orange-500"
                                        : "border-red-500"
                                )}
                                variant="outline"
                              >
                                {song.percentage}%
                              </Badge>
                              {pending ? (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  review
                                </Badge>
                              ) : null}
                              {scraping ? (
                                <Badge
                                  variant="outline"
                                  className="animate-pulse text-[10px]"
                                >
                                  scraping
                                </Badge>
                              ) : null}
                            </div>
                          ) : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination
          table={table}
          totalSongs={totalSongs}
          overallAccuracy=""
        />
      </div>

      {logsOpen ? (
        <aside className="flex w-72 shrink-0 flex-col rounded-md border bg-card lg:h-[66vh] xl:h-[76vh]">
          <div className="border-b px-3 py-2 text-sm font-medium">
            Scrape logs
          </div>
          <ScrollArea className="flex-1 p-3">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No log lines yet.</p>
            ) : (
              <ul className="space-y-1.5 font-mono text-[11px] leading-snug text-muted-foreground">
                {logs.map((line, i) => (
                  <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </aside>
      ) : null}
    </div>
  );
}
