import api from '@/lib/axios';
import { Proveedor, CreateProveedorForm, ApiResponse, PaginatedResponse } from '@/types';

export interface ProviderFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export const proveedoresService = {
  getAll: async (filters: ProviderFilters = {}): Promise<PaginatedResponse<Proveedor>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    const response = await api.get<PaginatedResponse<Proveedor>>(`/providers?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Proveedor> => {
    const response = await api.get<ApiResponse<Proveedor>>(`/providers/${id}`);
    return response.data.data;
  },

  create: async (data: CreateProveedorForm): Promise<Proveedor> => {
    const response = await api.post<ApiResponse<Proveedor>>('/providers', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Proveedor>): Promise<Proveedor> => {
    const response = await api.patch<ApiResponse<Proveedor>>(`/providers/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/providers/${id}`);
  }
};
