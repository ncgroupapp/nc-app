import api from '@/lib/axios';
import { PaginatedResponse, ApiResponse } from '@/types';

// Product interface matching backend entity
export interface Product {
  id: number;
  name: string;
  image?: string;
  providers?: Array<{
    id: number;
    name: string;
    rut: string;
    country: string;
  }>;
  brand?: string;
  model?: string;
  stockQuantity?: number;
  details?: string;
  observations?: string;
  chassis?: string;
  motor?: string;
  equipment?: string;
  quotationHistory?: unknown[];
  adjudicationHistory?: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductForm {
  name: string;
  image?: string;
  providerIds?: number[];
  brand?: string;
  model?: string;
  stockQuantity?: number;
  details?: string;
  observations?: string;
  chassis?: string;
  motor?: string;
  equipment?: string;
}

export interface ProductFilters {
  page?: number;
  search?: string;
}

export const productsService = {
  getAll: async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.search) params.append('search', filters.search);
    const response = await api.get<PaginatedResponse<Product>>(`/products?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  create: async (data: CreateProductForm): Promise<Product> => {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateProductForm>): Promise<Product> => {
    const response = await api.patch<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  }
};
