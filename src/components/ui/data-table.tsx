"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

import { Skeleton } from "@/components/ui/skeleton"

export interface TablePaginationProps {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

function getPaginationItems(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const delta = 1
  const left = page - delta
  const right = page + delta

  const items: (number | 'ellipsis')[] = []

  // Always include first page
  items.push(1)

  // Only use ellipsis if it hides more than one page; otherwise just show the page
  if (left > 3) {
    items.push('ellipsis')
  } else if (left === 3) {
    items.push(2)
  }

  for (let p = Math.max(2, left); p <= Math.min(totalPages - 1, right); p++) {
    items.push(p)
  }

  if (right < totalPages - 2) {
    items.push('ellipsis')
  } else if (right === totalPages - 2) {
    items.push(totalPages - 1)
  }

  // Always include last page
  items.push(totalPages)

  return items
}

function TablePagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  isLoading
}: TablePaginationProps) {
  const paginationItems = getPaginationItems(page, totalPages)

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div className="text-sm text-muted-foreground">
        {isLoading ? (
          <Skeleton className="h-4 w-[250px]" />
        ) : total === 0 ? (
          "Sin resultados"
        ) : (
          <>
            Mostrando del <span className="font-medium">{(page - 1) * limit + 1}</span> al <span className="font-medium">{Math.min(page * limit, total)}</span> de <span className="font-medium">{total}</span> resultados
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="w-10 h-10 p-0"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex gap-1">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-10 h-10" />
            ))
          ) : (
            paginationItems.map((item, i) =>
              item === 'ellipsis' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="w-5 h-10 flex items-center justify-center text-sm text-muted-foreground select-none"
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  variant={page === item ? 'default' : 'outline'}
                  size="sm"
                  className="w-10 h-10 p-0"
                  onClick={() => onPageChange(item)}
                  disabled={isLoading}
                >
                  {item}
                </Button>
              )
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-10 h-10 p-0"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export interface DataTableColumn<T> {
  key: string
  header: string
  accessorKey?: keyof T
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  isLoading?: boolean
  pagination?: TablePaginationProps
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  pagination,
  onRowClick,
  emptyMessage = "No hay datos disponibles"
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={i}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render
                        ? column.render(row)
                        : column.accessorKey
                          ? (row[column.accessorKey] as React.ReactNode)
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && <TablePagination {...pagination} isLoading={isLoading} />}
    </div>
  )
}
