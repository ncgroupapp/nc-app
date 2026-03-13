"use client";

import React, { useState, useEffect } from "react";
import { SearchInput } from "@/components/common/search-input";
import { DataTable, DataTableColumn, TablePaginationProps } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataViewProps<T> {
  title?: string;
  data: T[];
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  // Search
  search?: {
    placeholder: string;
    value: string;
    onSearch: (query: string) => void;
  };
  // Actions
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  // Extra filters or components
  filters?: React.ReactNode;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataView<T>({
  title,
  data,
  columns,
  isLoading,
  pagination,
  search,
  action,
  filters,
  onRowClick,
  emptyMessage,
  className,
}: DataViewProps<T>) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {search && (
            <div className="w-full max-w-sm">
              <SearchInput
                placeholder={search.placeholder}
                value={search.value}
                onChange={search.onSearch}
              />
            </div>
          )}
          {filters}
        </div>
        
        <div className="flex items-center gap-2">
          {action && (
            <Button onClick={action.onClick} className="shrink-0">
              {action.icon || <Plus className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onRowClick={onRowClick}
        emptyMessage={emptyMessage}
        pagination={{
          ...pagination,
          isLoading
        }}
      />
    </div>
  );
}
