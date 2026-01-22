import api from '@/lib/axios';
import { Cliente, CreateClienteForm, ApiResponse, PaginatedResponse, Licitacion, ClienteResponse } from '@/types';

export const clientesService = {
  getAll: async (
    page: number = 1,
    search?: string,
  ): Promise<PaginatedResponse<Cliente>> => {
    let url = `/clients?page=${page}`;

    if (search) {
      const term = encodeURIComponent(search);
      // Enviamos el mismo término para todos los campos para permitir búsqueda general (OR en backend)
      url += `&name=${term}&identifier=${term}&email=${term}`;
    }

    const response = await api.get<PaginatedResponse<Cliente>>(url);
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

  delete: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/clients/${id}`);
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
