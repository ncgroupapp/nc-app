import api from '@/lib/axios';
import { PaginatedResponse, ApiResponse } from '@/types';

// Types matching backend entity
export enum LicitationStatus {
  PENDING = 'Pending',
  PARTIAL_ADJUDICATION = 'Partial Adjudication',
  NOT_ADJUDICATED = 'Not Adjudicated',
  TOTAL_ADJUDICATION = 'Total Adjudication',
}

export interface Licitation {
  id: number;
  startDate: string;
  deadlineDate: string;
  clientId: number;
  callNumber: string;
  internalNumber: string;
  status: LicitationStatus;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    name: string;
    identifier: string;
    contacts?: Array<{
      name: string;
      email: string;
      phone?: string;
      address?: string;
    }>;
  };
  products?: Array<{
    id: number;
    name: string;
    stockQuantity?: number;
    brand?: string;
    model?: string;
  }>;
  quotations?: Array<{
    id: number;
    quotationIdentifier: string;
    status: string;
  }>;
}

export interface CreateLicitationDto {
  startDate: string;
  deadlineDate: string;
  clientId: number;
  callNumber: string;
  internalNumber: string;
  productIds: number[];
}

export interface UpdateLicitationDto {
  startDate?: string;
  deadlineDate?: string;
  clientId?: number;
  callNumber?: string;
  internalNumber?: string;
  productIds?: number[];
  status?: LicitationStatus;
}

export interface LicitationFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: LicitationStatus;
  clientId?: number;
}

export const licitacionesService = {
  getAll: async (filters: LicitationFilters = {}): Promise<PaginatedResponse<Licitation>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.clientId) params.append('clientId', filters.clientId.toString());
    
    const response = await api.get<PaginatedResponse<Licitation>>(`/licitations?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Licitation> => {
    const response = await api.get<ApiResponse<Licitation>>(`/licitations/${id}`);
    return response.data.data;
  },

  create: async (data: CreateLicitationDto): Promise<Licitation> => {
    const response = await api.post<ApiResponse<Licitation>>('/licitations', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateLicitationDto): Promise<Licitation> => {
    const response = await api.patch<ApiResponse<Licitation>>(`/licitations/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/licitations/${id}`);
  },
};
