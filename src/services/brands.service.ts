import api from '@/lib/axios';
import { Brand, Model, PaginatedResponse, ResponseBrand } from '@/types';

export const brandsService = {
  // Brand Endpoints
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<PaginatedResponse<Brand>>('/brands', { params });
    return data;
  },

  getById: async (id: number) => {
    const { data } = await api.get<ResponseBrand>(`/brands/${id}`);
    return data;
  },

  create: async (data: { name: string; models?: { name: string }[] }) => {
    const { data: result } = await api.post<Brand>('/brands', data);
    return result;
  },

  update: async (id: number, data: { name: string; models?: { name: string; id?: number }[] }) => {
    const { data: result } = await api.patch<Brand>(`/brands/${id}`, data);
    return result;
  },

  delete: async (id: number) => {
    await api.delete(`/brands/${id}`);
  },
};
