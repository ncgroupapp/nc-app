import { create } from 'zustand';
import { Brand } from '@/types';
import { brandsService } from '@/services/brands.service';

interface BrandsState {
  brands: Brand[];
  selectedBrand: Brand | null;
  isLoading: boolean;
  total: number;

  fetchBrands: (page?: number, search?: string) => Promise<void>;
  fetchBrandById: (id: number) => Promise<void>;
  createBrand: (data: { name: string; models?: { name: string }[] }) => Promise<void>;
  updateBrand: (id: number, data: { name: string; models?: { name: string; id?: number }[] }) => Promise<void>;
  deleteBrand: (id: number) => Promise<void>;
}

export const useBrandsStore = create<BrandsState>((set, get) => ({
  brands: [],
  selectedBrand: null,
  isLoading: false,
  total: 0,

  fetchBrands: async (page = 1, search = '') => {
    set({ isLoading: true });
    try {
      const res = await brandsService.getAll({ page, search });
      set({ brands: res.data, total: (res as any).meta?.total || (res as any).total || 0 });
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBrandById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await brandsService.getById(id);
      set({ selectedBrand: response.data });
    } catch (error) {
      console.error('Error fetching brand:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createBrand: async (data) => {
    await brandsService.create(data);
    get().fetchBrands();
  },

  updateBrand: async (id, data) => {
    await brandsService.update(id, data);
    get().fetchBrands();
    // Si editamos la marca actual, recargarla
    if (get().selectedBrand?.id === id) {
      get().fetchBrandById(id);
    }
  },

  deleteBrand: async (id) => {
    await brandsService.delete(id);
    get().fetchBrands();
  },
}));
