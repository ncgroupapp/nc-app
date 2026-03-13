import React from 'react';

export interface TableColumn<T> {
  key: keyof T
  title: string
  sortable?: boolean
  width?: string
  render?: (value: T[keyof T], record: T) => React.ReactNode
}

export interface FilterOption {
  label: string
  value: string
}

export interface DateRange {
  start: string
  end: string
}
