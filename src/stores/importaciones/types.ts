import { Importacion, CreateImportacionForm } from '@/types/importacion'
import { PaginationMeta } from '@/types/api'
import { ImportacionFilters } from '@/services/importaciones.service'

export interface ImportacionesState {
  importaciones: Importacion[]
  isLoading: boolean
  error: string | null
  pagination: PaginationMeta
  filters: ImportacionFilters
}

export interface ImportacionesActions {
  fetchImportaciones: (
    page?: number,
    search?: string,
    status?: string,
    providerId?: string,
    importDate?: string,
    fromDate?: string,
    toDate?: string,
  ) => Promise<void>
  createImportacion: (data: CreateImportacionForm) => Promise<void>
  updateImportacion: (id: string, data: Partial<CreateImportacionForm>) => Promise<void>
  deleteImportacion: (id: string) => Promise<void>
  changeEstado: (id: string, estado: Importacion['status']) => Promise<void>
  setFilters: (filters: Partial<ImportacionFilters>) => void
  setCurrentPage: (page: number) => void
}

export type ImportacionesStore = ImportacionesState & ImportacionesActions
