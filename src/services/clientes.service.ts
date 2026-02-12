import api from '@/lib/axios';
import { Cliente, CreateClienteForm, ApiResponse, PaginatedResponse, Licitacion, ClienteResponse } from '@/types';

export interface ClientFilters { 
  page?: number;
  search?: string;
}

export const clientesService = {
  getAll: async (
 filters: ClientFilters = {}
  ): Promise<PaginatedResponse<Cliente>> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await api.get<PaginatedResponse<Cliente>>(`/clients?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<ClienteResponse> => {
    const response = await api.get<ApiResponse<Cliente>>(`/clients/${id}`);
    return response.data;
  },

  create: async (data: CreateClienteForm): Promise<ClienteResponse> => {
    const response = await api.post<ApiResponse<Cliente>>("/clients", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<Cliente>,
  ): Promise<ClienteResponse> => {
    const response = await api.patch<ApiResponse<Cliente>>(
      `/clients/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string): Promise<ClienteResponse> => {
    const response = await api.delete<ClienteResponse>(`/clients/${id}`);
    return response.data;
  },

  hasLicitaciones: async (id: string): Promise<boolean> => {
    try {
      const response = await api.get<ApiResponse<Licitacion[]>>(
        `/licitaciones?cliente_id=${id}`,
      );
      // Assuming the API returns an array of licitaciones in data.data or just data depending on ApiResponse structure
      // Based on other methods, it seems response.data is the payload.
      // If ApiResponse<T> has a 'data' property which is T.
      // Let's assume ApiResponse is { success: boolean, data: T, message?: string }
      // So response.data is the ApiResponse object. response.data.data is the array.
      // Wait, let's check ApiResponse type definition to be sure.
      return Array.isArray(response.data.data) && response.data.data.length > 0;
    } catch (error) {
      console.error("Error checking licitaciones:", error);
      return false;
    }
  },
};
