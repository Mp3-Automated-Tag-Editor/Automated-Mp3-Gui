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

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export interface Preset {
  id: string
  name: string
}

export const presets: Preset[] = [
  {
    id: "9cb0e66a-9937-465d-a188-2c4c4ae2401f",
    name: "Grammatical Standard English",
  },
  {
    id: "61eb0e32-2391-4cd3-adc3-66efe09bc0b7",
    name: "Summarize for a 2nd grader",
  },
  {
    id: "a4e1fa51-f4ce-4e45-892c-224030a00bdd",
    name: "Text to command",
  },
  {
    id: "cc198b13-4933-43aa-977e-dcd95fa30770",
    name: "G:/Music/Editing Completed Songs (Ready for download)",
  },
  {
    id: "adfa95be-a575-45fd-a9ef-ea45386c64de",
    name: "English to other languages",
  },
  {
    id: "c569a06a-0bd6-43a7-adf9-bf68c09e7a79",
    name: "Parse unstructured data",
  },
  {
    id: "15ccc0d7-f37a-4f0a-8163-a37e162877dc",
    name: "Classification",
  },
  {
    id: "4641ef41-1c0f-421d-b4b2-70fe431081f3",
    name: "Natural language to Python",
  },
  {
    id: "48d34082-72f3-4a1b-a14d-f15aca4f57a0",
    name: "Explain code",
  },
  {
    id: "dfd42fd5-0394-4810-92c6-cc907d3bfd1a",
    name: "Chat",
  },
]

export function DataTableToolbar<TData>({
  table,
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
      <PresetSave />
    </div>
  )
}
