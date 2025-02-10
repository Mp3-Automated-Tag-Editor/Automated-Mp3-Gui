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
import { DataTableToolbar } from "../components/data-table-toolbar";
import { Song } from "../data/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSessionContext } from "@/components/context/SessionContext/SessionContext";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalSongs: number;
  functions: any;
  directory: string;
  sessionName: string;
  overallAccuracy: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalSongs,
  functions,
  directory,
  sessionName,
  overallAccuracy,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
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
    meta: {
      handleSongUpdate: (filePath: string, updatedSong: Song) =>
        functions.updateSong(filePath, updatedSong),
    },
  });

  const sessionData = useSessionContext();

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} directory={directory} />
      <div className="relative overflow-auto rounded-md border lg:h-[66vh] xl:h-[76vh]">
        {" "}
        {/*h-[90vh] sm:h-[85vh] md:h-[80vh] lg:h-[75vh] xl:h-[70vh] 2xl:h-[65vh] 3xl:h-[60vh]*/}
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {/* Check Song if it has been saved with current session. If never been saved - Red, If it has been saved before - yellow, with tooltip on hover sharing details from previous scraper, green if succesffuly saved/updated with latest scrape */}
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const rowPath = row.getValue("path");
                const rowId = row.id;

              // Find the corresponding song in sessionData
              const song = sessionData.sessionData.find((s: { path: string; }) => s.path === String(rowPath));

              // If the song exists, extract the percentage, otherwise default to 0
              const percentage = song ? song.percentage : 0;
                return (
                  <TableRow
                    key={rowId}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-100"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {cell.id.includes("_percentage") && sessionName != "" ? (
                          <div className="flex space-x-2">
                            {
                              <Badge
                                className={cn(
                                  "border",
                                  percentage >= 70
                                    ? "border-green-500"
                                    : percentage >= 50 && percentage < 70
                                    ? "border-yellow-500"
                                    : percentage >= 30 && percentage < 50
                                    ? "border-orange-500"
                                    : percentage < 30
                                    ? "border-red-500"
                                    : "border-black"
                                )}
                                variant="outline"
                              >
                                {percentage}%
                              </Badge>
                            }
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
                )
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
        overallAccuracy={overallAccuracy}
      />
    </div>
  );
}
