import { create } from 'zustand'
import { ImportacionesStore } from './types'
import { importacionesService } from '@/services/importaciones.service'

const initialPagination = {
  total: 0,
  page: 1,
  limit: 10,
  lastPage: 1,
}

export const useImportacionesStore = create<ImportacionesStore>((set, get) => ({
  importaciones: [],
  isLoading: false,
  error: null,
  pagination: initialPagination,
  filters: {
    page: 1,
    limit: 10,
  },

  fetchImportaciones: async (
    page = 1,
    search?: string,
    status?: string,
    providerId?: string,
    importDate?: string,
    fromDate?: string,
    toDate?: string,
  ) => {
    set({ isLoading: true, error: null })
    try {
      const response = await importacionesService.getAll({
        page,
        search,
        status,
        providerId,
        importDate,
        fromDate,
        toDate,
      })
      set({
        importaciones: response.data,
        pagination: response.meta,
        isLoading: false,
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al cargar importaciones'
      set({ error: message, isLoading: false })
    }
  },

  createImportacion: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await importacionesService.create(data)
      await get().fetchImportaciones(get().pagination.page)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al crear importación'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  updateImportacion: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await importacionesService.update(id, data)
      await get().fetchImportaciones(get().pagination.page)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al actualizar importación'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  deleteImportacion: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await importacionesService.delete(id)
      await get().fetchImportaciones(1)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al eliminar importación'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  changeEstado: async (id, estado) => {
    set({ isLoading: true, error: null })
    try {
      await importacionesService.changeEstado(id, estado)
      await get().fetchImportaciones(get().pagination.page)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al cambiar estado'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }))
  },

  setCurrentPage: (page) => {
    get().fetchImportaciones(page)
  },
}))
