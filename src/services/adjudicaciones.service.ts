import api from '@/lib/axios';
import { PaginatedResponse, ApiResponse, AdjudicationStatus } from '@/types';

// Types matching backend entities
export interface ProviderAdjudicationHistory {
  date: string;
  licitationNumber?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency?: string;
}

export interface AdjudicationItem {
  id?: number;
  adjudicationId?: number;
  productId?: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  createdAt?: string;
}

export interface NonAwardedItem {
  productId?: number;
  competitorName?: string;
  competitorRut?: string;
  competitorPrice?: number;
  competitorBrand?: string;
}

export interface Adjudication {
  id: number;
  quotationId: number;
  licitationId: number;
  status: AdjudicationStatus;
  totalQuantity: number;
  totalPriceWithoutIVA: number;
  totalPriceWithIVA: number;
  adjudicationDate: string;
  items: AdjudicationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdjudicationDto {
  quotationId: number;
  licitationId: number;
  status?: AdjudicationStatus;
  adjudicationDate?: string;
  items: Omit<AdjudicationItem, 'id' | 'adjudicationId' | 'createdAt'>[];
  nonAwardedItems?: NonAwardedItem[];
}

export interface AddAdjudicationItemDto {
  productId?: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
}

export interface AdjudicationFilters {
  page?: number;
  limit?: number;
  status?: AdjudicationStatus;
  quotationId?: number;
  licitationId?: number;
}


export interface ProductAdjudicationHistory {
  date: string;
  entity: string;
  status: string;
  quantity: number;
  unitPrice: number;
  contractId?: string;
  deadlineDate?: string;
  internalNumber?: string;
}

export const adjudicacionesService = {
  getByProductId: async (productId: number): Promise<ProductAdjudicationHistory[]> => {
    const response = await api.get<ProductAdjudicationHistory[]>(`/adjudications/by-product/${productId}`);
    return response.data;
  },

  getAll: async (filters: AdjudicationFilters = {}): Promise<PaginatedResponse<Adjudication>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.quotationId) params.append('quotationId', filters.quotationId.toString());
    if (filters.licitationId) params.append('licitationId', filters.licitationId.toString());
    
    const response = await api.get<PaginatedResponse<Adjudication>>(`/adjudications?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Adjudication> => {
    const response = await api.get<ApiResponse<Adjudication>>(`/adjudications/${id}`);
    return response.data.data;
  },

  getByQuotation: async (quotationId: number): Promise<Adjudication[]> => {
    const response = await api.get<Adjudication[]>(`/adjudications/quotation/${quotationId}`);
    return response.data;
  },

  getByLicitation: async (licitationId: number): Promise<Adjudication[]> => {
    const response = await api.get<ApiResponse<Adjudication[]> | Adjudication[]>(`/adjudications/licitation/${licitationId}`);
    const responseData = response.data;
    
    if (responseData && 'success' in responseData && responseData.success) {
      return responseData.data || [];
    }
    return (responseData as Adjudication[]) || [];
  },

  create: async (data: CreateAdjudicationDto): Promise<Adjudication> => {
    const response = await api.post<ApiResponse<Adjudication>>('/adjudications', data);
    return response.data.data;
  },

  addItem: async (id: number, item: AddAdjudicationItemDto): Promise<Adjudication> => {
    const response = await api.patch<ApiResponse<Adjudication>>(`/adjudications/${id}/items`, item);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/adjudications/${id}`);
  },

  updateAwardedQuantity: async (quotationItemId: number, quantity: number): Promise<void> => {
    await api.patch(`/adjudications/quotation-item/${quotationItemId}/quantity`, { quantity });
  },
  
  getByProviderId: async (providerId: string): Promise<ProviderAdjudicationHistory[]> => {
    const response = await api.get<ProviderAdjudicationHistory[]>(`/adjudications/by-provider/${providerId}`);
    return response.data;
  },

  getByClientId: async (clientId: string): Promise<Adjudication[]> => {
    const response = await api.get<ApiResponse<Adjudication[]> | Adjudication[]>(`/adjudications/by-client/${clientId}`);
    const responseData = response.data;

    if (responseData && 'success' in responseData && responseData.success) {
      return responseData.data || [];
    }

    if (Array.isArray(responseData)) {
      return responseData;
    }

    return [];
  },
};
