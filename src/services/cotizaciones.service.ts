import api from '@/lib/axios';
import { PaginatedResponse, ApiResponse, QuotationStatus, QuotationAwardStatus, Currency } from '@/types';

// Types matching backend entities
export interface QuotationItem {
  id?: number;
  quotationId?: number;
  productId?: number;
  productName: string;
  providerId?: number;
  providerName?: string;
  inStock: boolean;
  quantity: number;
  deliveryTime?: number;
  priceWithoutIVA: number;
  priceWithIVA: number;
  ivaPercentage: number;
  currency: Currency;
  awardStatus: QuotationAwardStatus;
  awardedQuantity?: number;
  competitorInfo?: {
    winnerName: string;
    winnerPrice: number;
    notes?: string;
  };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Quotation {
  id: number;
  quotationIdentifier: string;
  associatedPurchase?: string;
  status: QuotationStatus;
  description?: string;
  observations?: string;
  items: QuotationItem[];
  quotationDate?: string;
  validUntil?: string;
  clientId?: number;
  licitationId?: number;
  clientName?: string;
  paymentForm?: string;
  validity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotationItemDto {
  productId: number;
  providerId?: number;
  providerName?: string;
  inStock: boolean;
  quantity: number;
  deliveryTime?: number;
  priceWithoutIVA: number;
  priceWithIVA: number;
  ivaPercentage: number;
  currency: Currency;
  awardStatus: QuotationAwardStatus;
  awardedQuantity?: number;
  competitorInfo?: {
    winnerName: string;
    winnerPrice: number;
    notes?: string;
  };
  notes?: string;
}

export interface CreateQuotationDto {
  quotationIdentifier: string;
  licitationId: number;
  status: QuotationStatus;
  clientId?: number;
  clientName?: string;
  associatedPurchase?: string;
  description?: string;
  observations?: string;
  quotationDate?: string;
  validUntil?: string;
  paymentForm?: string;
  validity?: string;
  items: CreateQuotationItemDto[];
}

export interface UpdateQuotationDto {
  quotationIdentifier?: string;
  licitationId?: number;
  status?: QuotationStatus;
  clientId?: number;
  clientName?: string;
  associatedPurchase?: string;
  description?: string;
  observations?: string;
  quotationDate?: string;
  validUntil?: string;
  paymentForm?: string;
  validity?: string;
  items?: QuotationItem[];
}

export interface QuotationTotals {
  totalWithoutIVA: number;
  totalWithIVA: number;
  totalItems: number;
  itemsByCurrency: Record<string, { withoutIVA: number; withIVA: number }>;
}

export interface QuotationFilters {
  page?: number;
  limit?: number;
  status?: QuotationStatus;
  clientId?: number;
}

export const cotizacionesService = {
  getAll: async (filters: QuotationFilters = {}): Promise<PaginatedResponse<Quotation>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.clientId) params.append('clientId', filters.clientId.toString());
    
    const response = await api.get<PaginatedResponse<Quotation>>(`/quotation?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Quotation> => {
    const response = await api.get<ApiResponse<Quotation>>(`/quotation/${id}`);
    return response.data.data;
  },

  getByIdentifier: async (identifier: string): Promise<Quotation> => {
    const response = await api.get<ApiResponse<Quotation>>(`/quotation/identifier/${identifier}`);
    return response.data.data;
  },

  getTotals: async (id: number): Promise<QuotationTotals> => {
    const response = await api.get<QuotationTotals>(`/quotation/${id}/totals`);
    return response.data;
  },

  create: async (data: CreateQuotationDto): Promise<Quotation> => {
    const response = await api.post<ApiResponse<Quotation>>('/quotation', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateQuotationDto): Promise<Quotation> => {
    // Limpiar items para remover propiedades que el backend no acepta
    const cleanedData = { ...data };
    if (cleanedData.items) {
      cleanedData.items = cleanedData.items.map(item => ({
        productId: item.productId || 0,
        providerId: item.providerId,
        providerName: item.providerName,
        inStock: item.inStock,
        quantity: item.quantity,
        deliveryTime: item.deliveryTime,
        priceWithoutIVA: Number(item.priceWithoutIVA),
        priceWithIVA: Number(item.priceWithIVA),
        ivaPercentage: Number(item.ivaPercentage),
        currency: item.currency,
        awardStatus: item.awardStatus,
        awardedQuantity: item.awardedQuantity,
        competitorInfo: item.competitorInfo,
        notes: item.notes,
      })) as unknown as QuotationItem[];
    }
    const response = await api.patch<ApiResponse<Quotation>>(`/quotation/${id}`, cleanedData);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/quotation/${id}`);
  },

  // Finalizar cotización (cambia estado a finalizada - irreversible)
  finalize: async (id: number): Promise<Quotation> => {
    return cotizacionesService.update(id, { status: QuotationStatus.FINALIZED });
  },

  // PDF operations
  getPdfPreview: async (id: number): Promise<{ pdfBase64: string; quotationId: number; quotationIdentifier: string }> => {
    const response = await api.get(`/quotation/${id}/pdf/preview`);
    return response.data;
  },

  downloadPdf: async (id: number): Promise<Blob> => {
    const response = await api.get(`/quotation/${id}/pdf/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};