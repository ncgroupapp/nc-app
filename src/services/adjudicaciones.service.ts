import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { AdjudicationStatus } from '@/types/enums';

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
  unitPrice: number | string;
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
  identifier?: string; 
  quotationId: number;
  licitationId: number;
  status: AdjudicationStatus;
  totalQuantity: number;
  totalPriceWithoutIVA: number | string;
  totalPriceWithIVA: number | string;
  adjudicationDate: string;
  items: AdjudicationItem[];
  createdAt: string;
  updatedAt: string;
  licitation?: {
    callNumber: string;
    internalNumber?: string;
    client?: {
      name: string;
    }
  }
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
  search?: string;
  status?: AdjudicationStatus;
  quotationId?: number;
  licitationId?: number;
  productId?: number;
}


export interface ProductAdjudicationHistory {
  date: string;
  entity: string;
  status: string;
  quantity: number;
  unitPrice: number | string;
  contractId?: string;
  deadlineDate?: string;
  internalNumber?: string;
}

export const adjudicacionesService = {
  getByProductId: async (productId: number): Promise<ProductAdjudicationHistory[]> => {
    const response = await api.get<ApiResponse<any[]> | any[]>(`/adjudications/by-product/${productId}`);
    const responseData = response.data;
    
    let rawData: any[] = [];
    if (responseData && typeof responseData === 'object' && 'success' in responseData && responseData.success) {
      rawData = (responseData as any).data || [];
    } else if (Array.isArray(responseData)) {
      rawData = responseData;
    }

    // If the backend returns full Adjudication objects, we need to map them to ProductAdjudicationHistory
    return rawData.map(adj => {
      // Find the specific item for this product in the adjudication
      const item = adj.items?.find((i: any) => i.productId === productId);
      
      return {
        date: adj.adjudicationDate || adj.createdAt,
        entity: adj.licitation?.client?.name || adj.clientName || 'Cliente desconocido',
        status: adj.status,
        quantity: item?.quantity || adj.totalQuantity || 0,
        unitPrice: item?.unitPrice || 0,
        contractId: adj.identifier || `#${adj.id}`,
        deadlineDate: adj.deadlineDate,
        internalNumber: adj.licitation?.internalNumber || adj.licitation?.callNumber
      };
    });
  },

  getAll: async (filters: AdjudicationFilters = {}): Promise<PaginatedResponse<Adjudication>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.quotationId) params.append('quotationId', filters.quotationId.toString());
    if (filters.licitationId) params.append('licitationId', filters.licitationId.toString());
    if (filters.productId) params.append('productId', filters.productId.toString());

    const response = await api.get<PaginatedResponse<Adjudication>>(`/adjudications?${params.toString()}`);
    return response.data;
  },

  getPaginatedByProductId: async (productId: number, filters: AdjudicationFilters = {}): Promise<PaginatedResponse<Adjudication>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.quotationId) params.append('quotationId', filters.quotationId.toString());
    if (filters.licitationId) params.append('licitationId', filters.licitationId.toString());

    const response = await api.get<PaginatedResponse<Adjudication>>(`/adjudications/by-product/${productId}?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Adjudication> => {
    const response = await api.get<ApiResponse<Adjudication>>(`/adjudications/${id}`);
    return response.data.data;
  },

  getByQuotation: async (quotationId: number): Promise<Adjudication[]> => {
    const response = await api.get<ApiResponse<Adjudication[]> | Adjudication[]>(`/adjudications/quotation/${quotationId}`);
    const responseData = response.data;

    if (responseData && typeof responseData === 'object' && 'success' in responseData && responseData.success) {
      return responseData.data || [];
    }

    if (Array.isArray(responseData)) {
      return responseData;
    }

    return [];
  },

  getByLicitation: async (licitationId: number): Promise<Adjudication[]> => {
    const response = await api.get<ApiResponse<Adjudication[]> | Adjudication[]>(`/adjudications/licitation/${licitationId}`);
    const responseData = response.data;
    
    if (responseData && typeof responseData === 'object' && 'success' in responseData && responseData.success) {
      return responseData.data || [];
    }

    if (Array.isArray(responseData)) {
      return responseData;
    }

    return [];
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
    const response = await api.get<ApiResponse<ProviderAdjudicationHistory[]> | ProviderAdjudicationHistory[]>(`/quotation/by-provider/${providerId}`);
    const responseData = response.data;

    if (responseData && typeof responseData === 'object' && 'success' in responseData && responseData.success) {
      return responseData.data || [];
    }

    if (Array.isArray(responseData)) {
      return responseData;
    }

    return [];
  },

  getByClientId: async (clientId: string): Promise<Adjudication[]> => {
    const response = await api.get<ApiResponse<Adjudication[]> | PaginatedResponse<Adjudication> | Adjudication[]>(`/adjudications/by-client/${clientId}`);
    const responseData = response.data;

    if (responseData && typeof responseData === 'object' && 'success' in responseData && responseData.success) {
      return (responseData as any).data || [];
    }

    if (Array.isArray(responseData)) {
      return responseData;
    }

    return [];
  },
};
