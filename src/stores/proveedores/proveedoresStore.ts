import { create } from 'zustand';
import { ProveedoresStore } from './types';
import { proveedoresService } from '@/services/proveedores.service';

const initialPagination = {
  total: 0,
  page: 1,
  limit: 10,
  lastPage: 1
};

export const useProveedoresStore = create<ProveedoresStore>((set, get) => ({
  proveedores: [],
  isLoading: false,
  error: null,
  pagination: initialPagination,
  filters: {
    page: 1,
    limit: 10
  },

  fetchProveedores: async (page = 1, search?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await proveedoresService.getAll({ page, search });
      set({
        proveedores: response.data,
        pagination: response.meta,
        isLoading: false
      });
    } catch (error) {
      set({ error: (error as Error).message || 'Error al cargar proveedores', isLoading: false });
    }
  },

  createProveedor: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await proveedoresService.create(data);
      await get().fetchProveedores(get().pagination.page);
    } catch (error) {
      set({ error: (error as Error).message || 'Error al crear proveedor', isLoading: false });
      throw error;
    }
  },

  updateProveedor: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await proveedoresService.update(id, data);
      await get().fetchProveedores(get().pagination.page);
    } catch (error) {
      set({ error: (error as Error).message || 'Error al actualizar proveedor', isLoading: false });
      throw error;
    }
  },

  deleteProveedor: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await proveedoresService.delete(id);
      await get().fetchProveedores(1);
    } catch (error) {
      set({ error: (error as Error).message || 'Error al eliminar proveedor', isLoading: false });
      throw error;
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  setCurrentPage: (page) => {
    get().fetchProveedores(page);
  }
}));
