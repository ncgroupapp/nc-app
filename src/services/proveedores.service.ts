import api from '@/lib/axios';
import { Proveedor, CreateProveedorForm, ApiResponse, PaginatedResponse } from '@/types';

export const proveedoresService = {
  getAll: async (page: number = 1): Promise<PaginatedResponse<Proveedor>> => {
    const response = await api.get<PaginatedResponse<Proveedor>>(`/providers?page=${page}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Proveedor>> => {
    const response = await api.get<ApiResponse<Proveedor>>(`/providers/${id}`);
    return response.data;
  },

  create: async (data: CreateProveedorForm): Promise<ApiResponse<Proveedor>> => {
    const response = await api.post<ApiResponse<Proveedor>>('/providers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Proveedor>): Promise<ApiResponse<Proveedor>> => {
    const response = await api.patch<ApiResponse<Proveedor>>(`/providers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/providers/${id}`);
    return response.data;
  }
};
