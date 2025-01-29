import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSessionContext } from "@/components/context/SessionContext/SessionContext"
import { useEffect } from "react"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  totalSongs: number,
  overallAccuracy: string
}

export function DataTablePagination<TData>({
  table,
  totalSongs,
  overallAccuracy
}: DataTablePaginationProps<TData>) {
  const rowsLengthSelected: number = table.getFilteredSelectedRowModel().rows.length
  const rowsLength: number = table.getFilteredRowModel().rows.length
  const overallPercentage = overallAccuracy
  const sessionData = useSessionContext();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        table.setPageSize(30);
      } else if (window.innerWidth >= 1024) {
        table.setPageSize(20);
      } else {
        table.setPageSize(10);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {rowsLengthSelected > 0 ? rowsLengthSelected + " of " + rowsLength + " row(s) selected." : overallAccuracy!="" ? "Overall Completion Percentage: "+overallPercentage+"%" : "Total Songs: " + totalSongs}
      </div>
      {sessionData.sessionName != "" ? (
      <div className="mr-4 flex-1 flex items-center gap-2 flex-nowrap text-sm text-muted-foreground">
        {rowsLengthSelected > 0 ? (
          <Button variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1 min-w-0 w-auto">
            Review Selected Files
          </Button>
        ) : (
          <Button variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1 min-w-0 w-auto">
            Review All Files
          </Button>
        )}
        {rowsLengthSelected > 0 ? (
          <Button variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1 min-w-0 w-auto">
            Save Selected Files
          </Button>
        ) : (
          <Button variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1 min-w-0 w-auto">
            Save All Files
          </Button>
        )}
      </div>
    ) : null}   
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
