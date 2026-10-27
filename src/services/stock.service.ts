import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export const STOCK_CURRENCIES = ['USD', 'UYU', 'EUR', 'BRL', 'ARS', 'CLP'] as const;
export type StockCurrency = typeof STOCK_CURRENCIES[number];

export interface StockPurchase {
  id: number;
  productId: number;
  providerId: number | null;
  providerName: string | null;
  purchaseDate: string | null;
  orderNumber: string | null;
  quantity: number;
  unitCost: number;
  currency: StockCurrency;
  notes: string | null;
  createdAt: string;
}

export interface StockItem {
  id: number;
  name: string;
  code: string | null;
  brand: string | null;
  model: string | null;
  image: string | null;
  stockQuantity: number;
  purchasesCount: number;
  lastPurchase: StockPurchase | null;
}

export interface StockSummary {
  productsInStock: number;
  unitsInStock: number;
  productsWithCost: number;
  valueByCurrency: Array<{ currency: StockCurrency; value: number }>;
}

export interface StockPurchaseForm {
  providerId?: number | null;
  providerName?: string | null;
  purchaseDate?: string | null;
  orderNumber?: string | null;
  quantity: number;
  unitCost: number;
  currency: StockCurrency;
  notes?: string | null;
}

export interface StockFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export const stockService = {
  getInStock: async (filters: StockFilters = {}): Promise<PaginatedResponse<StockItem>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    const response = await api.get<PaginatedResponse<StockItem>>(`/stock?${params.toString()}`);
    return response.data;
  },

  getSummary: async (): Promise<StockSummary> => {
    const response = await api.get<ApiResponse<StockSummary>>('/stock/summary');
    return response.data.data;
  },

  getPurchases: async (productId: number): Promise<StockPurchase[]> => {
    const response = await api.get<ApiResponse<StockPurchase[]>>(`/stock/products/${productId}/purchases`);
    return response.data.data;
  },

  createPurchase: async (productId: number, data: StockPurchaseForm): Promise<StockPurchase> => {
    const response = await api.post<ApiResponse<StockPurchase>>(`/stock/products/${productId}/purchases`, data);
    return response.data.data;
  },

  updatePurchase: async (id: number, data: Partial<StockPurchaseForm>): Promise<StockPurchase> => {
    const response = await api.patch<ApiResponse<StockPurchase>>(`/stock/purchases/${id}`, data);
    return response.data.data;
  },

  deletePurchase: async (id: number): Promise<void> => {
    await api.delete(`/stock/purchases/${id}`);
  },
};

/** "USD 1.234,50" (Uruguayan number format). */
export function formatMoney(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
