"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/app/(dashboard)/(routes)/edit/components/data-table-view-options"
import { PresetSave } from "../components/preset-save"
import { PresetSelector } from "../components/preset-selector"
import { genres, statuses } from "../data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { presets } from "../data/presets"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  directory: string
}

export function DataTableToolbar<TData>({
  table,
  directory
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search Songs"
          value={((table.getColumn("title")?.getFilterValue() as string) || (table.getColumn("id")?.getFilterValue() as string)) ?? ""}
          onChange={(event) => {
            //TODO - table search for songs + artists 
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {/* {table.getColumn("artist") && (
          <DataTableFacetedFilter
            column={table.getColumn("id")}
            title="Id"
            options={} // Find a Way to create a dynamic Object based on obtained data
          />
        )}
        {table.getColumn("album") && (
          <DataTableFacetedFilter
            column={table.getColumn("id")}
            title="Id"
            options={} // Find a Way to create a dynamic Object based on obtained data
          />
        )} */}
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
      </div>
      <DataTableViewOptions table={table} />
      <PresetSelector presets={presets} />
      <PresetSave directory={directory} />
    </div>
  )
}
