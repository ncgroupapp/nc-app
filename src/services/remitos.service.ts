import api from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export type RemitoStatus = 'emitido' | 'entregado' | 'anulado';

export const REMITO_STATUS_LABELS: Record<RemitoStatus, string> = {
  emitido: 'Emitido',
  entregado: 'Entregado',
  anulado: 'Anulado',
};

export const REMITO_STATUS_CLASSES: Record<RemitoStatus, string> = {
  emitido: 'bg-blue-100 text-blue-800 border-blue-200',
  entregado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  anulado: 'bg-red-100 text-red-700 border-red-200',
};

export interface RemitoItem {
  id?: number;
  productId?: number | null;
  code?: string | null;
  description: string;
  quantity: number;
}

export interface RemitoInput {
  date?: string;
  clientId?: number | null;
  licitationId?: number | null;
  receiverName: string;
  receiverRut?: string | null;
  receiverAddress?: string | null;
  receiverCity?: string | null;
  receiverPhone?: string | null;
  purchaseOrder?: string | null;
  reference?: string | null;
  notes?: string | null;
  items: RemitoItem[];
}

export interface Remito extends RemitoInput {
  id: number;
  number: number;
  date: string;
  status: RemitoStatus;
  deliveredAt: string | null;
  createdAt: string;
}

export interface ShippingGuideInput {
  recipientName: string;
  recipientPhone?: string | null;
  addressLines: string[];
  senderName?: string;
  senderPhone?: string | null;
  senderRut?: string | null;
  clientId?: number | null;
  remitoId?: number | null;
}

export interface ShippingGuide extends ShippingGuideInput {
  id: number;
  senderName: string;
  createdAt: string;
}

export const formatRemitoNumber = (number: number) => String(number).padStart(6, '0');

/** YYYY-MM-DD → DD/MM/YYYY without timezone shifts. */
export const formatIsoDate = (date: string | null | undefined) => {
  if (!date) return '-';
  const [year, month, day] = date.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

const fetchPdf = async (url: string): Promise<Blob> => {
  const response = await api.get(url, { responseType: 'blob' });
  return new Blob([response.data], { type: 'application/pdf' });
};

export const remitosService = {
  getAll: async (filters: { search?: string; status?: RemitoStatus } = {}): Promise<Remito[]> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    const response = await api.get<ApiResponse<Remito[]>>(`/remitos?${params.toString()}`);
    return response.data.data;
  },

  create: async (data: RemitoInput): Promise<Remito> => {
    const response = await api.post<ApiResponse<Remito>>('/remitos', data);
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<RemitoInput> & { status?: RemitoStatus; deliveredAt?: string | null },
  ): Promise<Remito> => {
    const response = await api.patch<ApiResponse<Remito>>(`/remitos/${id}`, data);
    return response.data.data;
  },

  draftFromLicitation: async (licitationId: number): Promise<RemitoInput> => {
    const response = await api.get<ApiResponse<RemitoInput>>(`/remitos/draft/licitation/${licitationId}`);
    return response.data.data;
  },

  getPdf: (id: number) => fetchPdf(`/remitos/${id}/pdf`),

  getGuides: async (search?: string): Promise<ShippingGuide[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get<ApiResponse<ShippingGuide[]>>(`/remitos/guides${params}`);
    return response.data.data;
  },

  createGuide: async (data: ShippingGuideInput): Promise<ShippingGuide> => {
    const response = await api.post<ApiResponse<ShippingGuide>>('/remitos/guides', data);
    return response.data.data;
  },

  updateGuide: async (id: number, data: Partial<ShippingGuideInput>): Promise<ShippingGuide> => {
    const response = await api.patch<ApiResponse<ShippingGuide>>(`/remitos/guides/${id}`, data);
    return response.data.data;
  },

  deleteGuide: async (id: number): Promise<void> => {
    await api.delete(`/remitos/guides/${id}`);
  },

  /** Two guides per A4 landscape sheet, in the given order. */
  getGuidesPdf: (ids: number[]) => fetchPdf(`/remitos/guides/pdf?ids=${ids.join(',')}`),
};
