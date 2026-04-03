import { create } from 'zustand';
import { Brand, Model } from '@/types/brand';
import { PaginationMeta } from '@/types/api';
import { brandsService } from '@/services/brands.service';

interface MarcasState {
  brands: Brand[];
  models: Model[];
  selectedBrand: Brand | null;
  isLoading: boolean;
  isModelsLoading: boolean;
  pagination: PaginationMeta;

  fetchBrands: (page?: number, search?: string) => Promise<void>;
  fetchBrandById: (id: number) => Promise<void>;
  createBrand: (data: { name: string; models?: { name: string }[] }) => Promise<void>;
  updateBrand: (id: number, data: { name: string; models?: { name: string; id?: number }[] }) => Promise<void>;
  deleteBrand: (id: number) => Promise<void>;
}

const DEFAULT_PAGINATION: PaginationMeta = {
  total: 0,
  page: 1,
  lastPage: 1,
  limit: 10,
};

export const useMarcasStore = create<MarcasState>((set, get) => ({
  brands: [],
  models: [],
  selectedBrand: null,
  isLoading: false,
  isModelsLoading: false,
  pagination: DEFAULT_PAGINATION,

  fetchBrands: async (page = 1, search = '') => {
    set({ isLoading: true });
    try {
      const res = await brandsService.getAll({ page, search });
      set({ 
        brands: res.data, 
        pagination: res.meta || {
          ...DEFAULT_PAGINATION,
          total: (res as any).total || 0,
          page: page
        }
      });
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBrandById: async (id: number) => {
    set({ isLoading: true });
    try {
      const response = await brandsService.getById(id);
      set({ selectedBrand: response.data, models: response.data.models || [] });
    } catch (error) {
      console.error('Error fetching brand:', error);
      set({ selectedBrand: null, models: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  createBrand: async (data) => {
    await brandsService.create(data);
    get().fetchBrands(get().pagination.page);
  },

  updateBrand: async (id, data) => {
    await brandsService.update(id, data);
    get().fetchBrands(get().pagination.page);
    // Si editamos la marca actual, recargarla
    if (get().selectedBrand?.id === id) {
      get().fetchBrandById(id);
    }
  },

  deleteBrand: async (id) => {
    await brandsService.delete(id);
    get().fetchBrands(1);
  },
}));
