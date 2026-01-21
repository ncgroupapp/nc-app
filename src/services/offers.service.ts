import api from '@/lib/axios';
import { PaginatedResponse, ApiResponse, Proveedor } from '@/types';
import { Product } from './products.service';

// Types matching backend entities
export interface Offer {
  id: number;
  name?: string;
  productId: number;
  productName?: string;
  product?: Product;
  providerId: number;
  providerName?: string;
  provider?: Proveedor;
  price: number;
  quantity: number;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferFilters {
  page?: number;
  limit?: number;
  search?: string;
  productId?: number;
  providerId?: number;
}

export interface CreateOfferDto {
  name?: string;
  productId: number;
  providerId: number;
  price: number;
  quantity: number;
  deliveryDate?: string;
}

export interface UpdateOfferDto extends Partial<CreateOfferDto> {}

export const offersService = {
  getAll: async (filters: OfferFilters = {}): Promise<PaginatedResponse<Offer>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.productId) params.append('productId', filters.productId.toString());
    if (filters.providerId) params.append('providerId', filters.providerId.toString());
    
    const response = await api.get<PaginatedResponse<Offer>>(`/offers?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Offer> => {
    const response = await api.get<ApiResponse<Offer>>(`/offers/${id}`);
    return response.data.data;
  },

  create: async (data: CreateOfferDto): Promise<Offer> => {
    const response = await api.post<ApiResponse<Offer>>('/offers', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateOfferDto): Promise<Offer> => {
    const response = await api.patch<ApiResponse<Offer>>(`/offers/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/offers/${id}`);
  },
};
