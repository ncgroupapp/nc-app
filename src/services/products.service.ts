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
  code?: string;
  equivalentCodes?: string[];
  stockQuantity?: number; // mapped to stock in JSON
  stock?: number;
  details?: string;
  observations?: string;
  chassis?: string;
  motor?: string;
  equipment?: string;
  quotationHistory?: Array<{
    date: string;
    status: string;
    currency: string;
    provider: string;
    validUntil?: string;
    quotationId?: string;
    quotedPrice: number;
    ivaPercentage?: number;
    associatedPurchase?: string;
  }>;
  adjudicationHistory?: Array<{
    date: string;
    entity: string; // The "client" or entity
    status: string;
    quantity: number;
    unitPrice: number;
    contractId?: string;
    deadlineDate?: string;
    internalNumber?: string;
  }>;
  description?: string;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductForm {
  name: string;
  image?: string;
  providerIds?: number[];
  brand?: string;
  model?: string;
  code?: string;
  equivalentCodes?: string[];
  stockQuantity?: number;
  stock?: number;
  details?: string;
  observations?: string;
  chassis?: string;
  motor?: string;
  equipment?: string;
  description?: string;
  price?: number;
}

export interface ProductFilters {
  page?: number;
  search?: string;
  providerId?: number;
}

export const productsService = {
  getAll: async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.providerId) params.append('providerIds', filters.providerId.toString());
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
