import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { Proveedor } from '@/types/proveedor';
import { Product } from './products.service';
import { Currency } from '@/types/enums';

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
  currency?: Currency;
  iva?: number;
  quantity: number;
  origin?: string;
  delivery?: number; // Days for delivery
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferFilters {
  page?: number;
  limit?: number;
  search?: string;
  productId?: number | number[];
  providerId?: number | number[];
}

export interface CreateOfferDto {
  name?: string;
  productId: number;
  providerId: number;
  price: number;
  currency?: Currency;
  iva?: number;
  quantity: number;
  origin?: string;
  delivery?: number;
  deliveryDate?: string;
}

export type UpdateOfferDto = Partial<CreateOfferDto>;

export const offersService = {
  getAll: async (filters: OfferFilters = {}): Promise<PaginatedResponse<Offer>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    
    if (filters.productId) {
      if (Array.isArray(filters.productId)) {
        filters.productId.forEach(id => params.append('productId', id.toString()));
      } else {
        params.append('productId', filters.productId.toString());
      }
    }

    if (filters.providerId) {
      if (Array.isArray(filters.providerId)) {
        filters.providerId.forEach(id => params.append('providerId', id.toString()));
      } else {
        params.append('providerId', filters.providerId.toString());
      }
    }
    
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
