export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginationMeta {
  total: number
  page: number
  lastPage: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
  success: boolean
}

export interface PaginatedResponseLegacy<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
