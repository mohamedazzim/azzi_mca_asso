"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown, 
  Search, 
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  EyeOff
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/loading-states"

// Column definition interface
export interface ColumnDef<T> {
  id: string
  header: string | React.ReactNode
  accessorKey?: keyof T
  cell?: (value: any, row: T, index: number) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  align?: "left" | "center" | "right"
  sticky?: boolean
  hidden?: boolean
}

// Table props interface
export interface AdvancedTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
  sorting?: {
    sortBy?: string
    sortOrder?: "asc" | "desc"
    onSort: (sortBy: string, sortOrder: "asc" | "desc") => void
  }
  selection?: {
    selectedRows: string[]
    onSelectionChange: (selectedRows: string[]) => void
    getRowId: (row: T) => string
  }
  search?: {
    searchTerm: string
    onSearch: (term: string) => void
    placeholder?: string
  }
  filters?: {
    filters: Record<string, any>
    onFilterChange: (filters: Record<string, any>) => void
  }
  actions?: {
    bulkActions?: Array<{
      label: string
      icon?: React.ReactNode
      onClick: (selectedRows: T[]) => void
      variant?: "default" | "destructive"
    }>
    rowActions?: Array<{
      label: string
      icon?: React.ReactNode
      onClick: (row: T) => void
      variant?: "default" | "destructive"
      condition?: (row: T) => boolean
    }>
  }
  exportable?: boolean
  onExport?: (format: "csv" | "json" | "pdf") => void
  className?: string
}

export function AdvancedTable<T>({
  data,
  columns: initialColumns,
  loading = false,
  pagination,
  sorting,
  selection,
  search,
  filters,
  actions,
  exportable = false,
  onExport,
  className
}: AdvancedTableProps<T>) {
  const [columns, setColumns] = React.useState(initialColumns)
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(
    initialColumns.reduce((acc, col) => ({ ...acc, [col.id]: !col.hidden }), {})
  )

  // Handle column visibility
  const visibleColumns = columns.filter(col => columnVisibility[col.id])

  // Handle row selection
  const isAllSelected = selection && data.length > 0 && 
    data.every(row => selection.selectedRows.includes(selection.getRowId(row)))
  
  const isIndeterminate = selection && selection.selectedRows.length > 0 && !isAllSelected

  const handleSelectAll = () => {
    if (!selection) return
    
    if (isAllSelected) {
      selection.onSelectionChange([])
    } else {
      selection.onSelectionChange(data.map(selection.getRowId))
    }
  }

  const handleRowSelect = (rowId: string) => {
    if (!selection) return
    
    const newSelection = selection.selectedRows.includes(rowId)
      ? selection.selectedRows.filter(id => id !== rowId)
      : [...selection.selectedRows, rowId]
    
    selection.onSelectionChange(newSelection)
  }

  // Get selected row data
  const selectedRowsData = selection 
    ? data.filter(row => selection.selectedRows.includes(selection.getRowId(row)))
    : []

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Header with Search, Filters, and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          {/* Search */}
          {search && (
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={search.placeholder || "Search..."}
                value={search.searchTerm}
                onChange={(e) => search.onSearch(e.target.value)}
                className="pl-10 max-w-sm"
              />
            </div>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <EyeOff className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={columnVisibility[column.id]}
                  onCheckedChange={(checked) =>
                    setColumnVisibility(prev => ({ ...prev, [column.id]: checked }))
                  }
                >
                  {typeof column.header === "string" ? column.header : column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2">
          {/* Bulk Actions */}
          {actions?.bulkActions && selection && selectedRowsData.length > 0 && (
            <div className="flex gap-2">
              {actions.bulkActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  size="sm"
                  onClick={() => action.onClick(selectedRowsData)}
                >
                  {action.icon}
                  {action.label} ({selectedRowsData.length})
                </Button>
              ))}
            </div>
          )}

          {/* Export */}
          {exportable && onExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onExport("csv")}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("json")}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("pdf")}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {/* Selection Column */}
                {selection && (
                  <th className="w-12 px-4 py-3 text-left">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate
                      }}
                      onChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                  </th>
                )}

                {/* Data Columns */}
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      "px-4 py-3 text-left font-medium text-sm text-muted-foreground",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.sticky && "sticky left-0 bg-muted/50"
                    )}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sorting && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => {
                            const newOrder = 
                              sorting.sortBy === column.id && sorting.sortOrder === "asc" 
                                ? "desc" 
                                : "asc"
                            sorting.onSort(column.id, newOrder)
                          }}
                        >
                          {sorting.sortBy === column.id ? (
                            sorting.sortOrder === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </th>
                ))}

                {/* Actions Column */}
                {actions?.rowActions && (
                  <th className="w-12 px-4 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-t">
                    {selection && (
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-4" />
                      </td>
                    )}
                    {visibleColumns.map((column) => (
                      <td key={column.id} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                    {actions?.rowActions && (
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-4 ml-auto" />
                      </td>
                    )}
                  </tr>
                ))
              ) : data.length === 0 ? (
                // Empty state
                <tr>
                  <td 
                    colSpan={
                      visibleColumns.length + 
                      (selection ? 1 : 0) + 
                      (actions?.rowActions ? 1 : 0)
                    }
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                // Data rows
                data.map((row, rowIndex) => {
                  const rowId = selection?.getRowId(row) || String(rowIndex)
                  const isSelected = selection?.selectedRows.includes(rowId) || false

                  return (
                    <tr 
                      key={rowId} 
                      className={cn(
                        "border-t hover:bg-muted/50 transition-colors",
                        isSelected && "bg-muted/50"
                      )}
                    >
                      {/* Selection */}
                      {selection && (
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleRowSelect(rowId)}
                            aria-label={`Select row ${rowIndex + 1}`}
                          />
                        </td>
                      )}

                      {/* Data cells */}
                      {visibleColumns.map((column) => {
                        const value = column.accessorKey ? row[column.accessorKey] : undefined
                        const cellContent = column.cell 
                          ? column.cell(value, row, rowIndex)
                          : String(value || "")

                        return (
                          <td
                            key={column.id}
                            className={cn(
                              "px-4 py-3 text-sm",
                              column.align === "center" && "text-center",
                              column.align === "right" && "text-right",
                              column.sticky && "sticky left-0 bg-background"
                            )}
                          >
                            {cellContent}
                          </td>
                        )
                      })}

                      {/* Row actions */}
                      {actions?.rowActions && (
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.rowActions
                                .filter(action => !action.condition || action.condition(row))
                                .map((action, index) => (
                                  <DropdownMenuItem
                                    key={index}
                                    onClick={() => action.onClick(row)}
                                    className={cn(
                                      action.variant === "destructive" && "text-destructive"
                                    )}
                                  >
                                    {action.icon}
                                    {action.label}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => pagination.onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.pageSize)) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => pagination.onPageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}