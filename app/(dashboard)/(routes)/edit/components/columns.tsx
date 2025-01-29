"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { genres, statuses } from "../data/data"
import { Song } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { cn } from "@/lib/utils"

export const columns: ColumnDef<Song>[] = [
  {
    id: "actions",
    cell: ({ row, table }) => <DataTableRowActions row={row} table={table} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="#" />
    ),
    cell: ({ row }) => <div className="w-[40px]">{row.getValue("id")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "file",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="File Name" />
    ),
    cell: ({ row }) => <div className="max-w-[300px] min-w-[50px] truncate">{row.getValue("file")}</div>,

    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "percentage",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="%" />
    ),
    cell: ({ row }) => {
      const percentage: number = row.getValue("percentage")

      return (
        <div className="flex space-x-2">
          {<Badge className={cn("border", percentage >= 70 ? "border-green-500" :
            percentage >= 50 && percentage < 70 ? "border-yellow-500" :
              percentage >= 30 && percentage < 50 ? 'border-orange-500' :
                percentage < 30 ? 'border-red-500' : 'border-black')} variant="outline">{percentage}%</Badge>}
        </div>
      )
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] min-w-[250px] truncate">
            {row.getValue("title")}
          </span>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "artist",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Artist" />
    ),
    cell: ({ row }) => {
      const artist: string = row.getValue("artist")

      if (!artist) {
        return null
      }

      return (
        <div className="flex w-[250px] truncate items-center">
          <span>{artist}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: false,
  },
  {
    accessorKey: "album",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Album" />
    ),
    cell: ({ row }) => {
      const album: string = row.getValue("album")

      if (!album) {
        return null
      }

      return (
        <div className="flex w-[250px] truncate items-center">
          <span>{album}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: false,
  },
  {
    accessorKey: "path",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Path" />
    ),
    cell: ({ row }) => <div className="max-w-[300px] min-w-[50px] truncate">{row.getValue("path")}</div>,

    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "year",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Year" />
    ),
    cell: ({ row }) => {
      const year: number = row.getValue("year")

      if (!year) {
        return null
      }

      return (
        <div className="flex w-[50px] items-center">
          <span>{year}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "genre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Genre" />
    ),
    cell: ({ row }) => {
      const genre = genres.find(
        (obj) => obj.label === row.getValue("genre")
      )

      if (!genre) {
        return null
      }

      return (
        <div className="flex w-[50px] items-center">
          <span>{genre.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "track",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Track" />
    ),
    cell: ({ row }) => {
      const track: string = row.getValue("track")

      if (!track) {
        return null
      }

      return (
        <div className="flex w-[50px] items-center">
          <span>{track}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // {
  //   accessorKey: "discno",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Disc Number" />
  //   ),
  //   cell: ({ row }) => {
  //     const discno: number = row.getValue("discno")

  //     if (!discno) {
  //       return null
  //     }

  //     return (
  //       <div className="flex w-[150px] items-center">
  //         <span>{discno}</span>
  //       </div>
  //     )
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id))
  //   },
  // },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("status")
      )

      if (!status) {
        return null
      }

      return (
        <div className="flex w-[150px] items-center">
          {status.icon && (
            <status.icon className={`mr-2 h-4 w-4 text-muted-foreground text-${status.color}-500`}/>
          )}
          <span>{status.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // {
  //   accessorKey: "priority",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Priority" />
  //   ),
  //   cell: ({ row }) => {
  //     const priority = priorities.find(
  //       (priority) => priority.value === row.getValue("priority")
  //     )

  //     if (!priority) {
  //       return null
  //     }

  //     return (
  //       <div className="flex items-center">
  //         {priority.icon && (
  //           <priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
  //         )}
  //         <span>{priority.label}</span>
  //       </div>
  //     )
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id))
  //   },
  // },
]
