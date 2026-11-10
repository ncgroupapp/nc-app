import api from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export interface PurchaseOrderInvoice {
  id: number;
  type: 'factura' | 'nota_credito';
  series: string | null;
  number: string | null;
  issueDate: string | null;
  currency: string | null;
  total: number | null;
}

export interface PurchaseOrderRemito {
  id: number;
  number: number;
  date: string;
  status: string;
}

export interface PurchaseOrder {
  id: number;
  number: string;
  /** YYYY-MM-DD */
  issueDate: string | null;
  clientId: number | null;
  clientName: string | null;
  licitationId: number | null;
  licitation: { id: number; callNumber: string; internalNumber: string | null } | null;
  currency: 'UYU' | 'USD' | null;
  total: number | null;
  notes: string | null;
  fileName: string | null;
  fileSize: number | null;
  invoices: PurchaseOrderInvoice[];
  remitos: PurchaseOrderRemito[];
  createdAt: string;
}

export interface PurchaseOrderInput {
  number: string;
  issueDate?: string | null;
  clientId?: number | null;
  licitationId?: number | null;
  currency?: 'UYU' | 'USD' | null;
  total?: number | null;
  notes?: string | null;
  invoiceIds?: number[];
  remitoIds?: number[];
}

export interface PurchaseOrderMetrics {
  total: number;
  thisMonth: number;
  amounts: { UYU: number; USD: number };
  withoutInvoice: number;
  withoutRemito: number;
  withoutFile: number;
}

/** What the app could read from an order PDF before saving it */
export interface PurchaseOrderReading {
  /** False for scanned PDFs: there is no text to read */
  readable: boolean;
  number: string | null;
  issueDate: string | null;
  clientName: string | null;
  clientRut: string | null;
  currency: 'UYU' | 'USD' | null;
  total: number | null;
  purchaseNumber: string | null;
  client: { id: number; name: string } | null;
  licitation: { id: number; callNumber: string; internalNumber: string | null } | null;
  existingOrderId: number | null;
}

export interface PurchaseOrderList {
  data: PurchaseOrder[];
  meta: { total: number; page: number; limit: number; lastPage: number };
}

export const purchaseOrdersService = {
  getAll: async (filters: { search?: string; page?: number; limit?: number } = {}): Promise<PurchaseOrderList> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    // Paginated answers come as { success, data, meta } (not wrapped again in data)
    const response = await api.get<PurchaseOrderList & { success: boolean }>(`/purchase-orders?${params.toString()}`);
    return { data: response.data.data, meta: response.data.meta };
  },

  getMetrics: async (): Promise<PurchaseOrderMetrics> => {
    const response = await api.get<ApiResponse<PurchaseOrderMetrics>>('/purchase-orders/metrics');
    return response.data.data;
  },

  create: async (data: PurchaseOrderInput): Promise<PurchaseOrder> => {
    const response = await api.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<PurchaseOrderInput>): Promise<PurchaseOrder> => {
    const response = await api.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/purchase-orders/${id}`);
  },

  read: async (file: File): Promise<PurchaseOrderReading> => {
    const form = new FormData();
    form.append('file', file, file.name);
    const response = await api.post<ApiResponse<PurchaseOrderReading>>('/purchase-orders/read', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  uploadFile: async (id: number, file: File): Promise<PurchaseOrder> => {
    const form = new FormData();
    form.append('file', file, file.name);
    const response = await api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  getFile: async (order: Pick<PurchaseOrder, 'id' | 'fileName'>): Promise<Blob> => {
    const response = await api.get(`/purchase-orders/${order.id}/file`, { responseType: 'blob' });
    const type = /\.pdf$/i.test(order.fileName ?? '') ? 'application/pdf' : response.headers['content-type'];
    return new Blob([response.data], { type });
  },
};
