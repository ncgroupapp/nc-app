import { create } from 'zustand';
import { ProductsStore } from './types';
import { productsService } from '@/services/products.service';

const initialPagination = {
  total: 0,
  page: 1,
  limit: 10,
  lastPage: 1
};

export const useProductsStore = create<ProductsStore>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  pagination: initialPagination,
  filters: {
    page: 1,
    limit: 10
  },

  fetchProducts: async (page = 1, search?: string, providerId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productsService.getAll({ page, search, providerId });
      set({
        products: response.data,
        pagination: response.meta,
        isLoading: false
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar productos';
      set({ error: message, isLoading: false });
    }
  },

  createProduct: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await productsService.create(data);
      await get().fetchProducts(get().pagination.page);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear producto';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateProduct: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await productsService.update(id, data);
      await get().fetchProducts(get().pagination.page);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar producto';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await productsService.delete(id);
      await get().fetchProducts(1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar producto';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  setCurrentPage: (page) => {
    get().fetchProducts(page);
  }
}));
