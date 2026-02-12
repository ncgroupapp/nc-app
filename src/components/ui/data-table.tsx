"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export interface TablePaginationProps {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

function TablePagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  isLoading
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div className="text-sm text-blue-950">
        Mostrando {total > 0 ? (page - 1) * limit + 1 : 0} a{' '}
        {Math.min(page * limit, total)} de {total} resultados
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          Anterior
        </Button>
        
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={page === p ? 'default' : 'outline'}
              size="sm"
              className="w-10 h-10 p-0"
              onClick={() => onPageChange(p)}
              disabled={isLoading}
            >
              {p}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
        >
          Siguiente
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
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Cargando...
                </TableCell>
              </TableRow>
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
