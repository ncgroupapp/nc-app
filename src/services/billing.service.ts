import api from '@/lib/axios';
import { ApiResponse, PaginationMeta } from '@/types/api';

export type BillingDocumentType = 'factura' | 'nota_credito';
export type BillingCurrency = 'UYU' | 'USD';

export const BILLING_TYPE_LABELS: Record<BillingDocumentType, string> = {
  factura: 'Factura',
  nota_credito: 'Nota de crédito',
};

export const BILLING_TYPE_CLASSES: Record<BillingDocumentType, string> = {
  factura: 'bg-blue-100 text-blue-800 border-blue-200',
  nota_credito: 'bg-amber-100 text-amber-800 border-amber-200',
};

export interface BillingDocument {
  id: number;
  type: BillingDocumentType;
  cfeType: number | null;
  series: string | null;
  number: string | null;
  /** YYYY-MM-DD */
  issueDate: string | null;
  clientName: string | null;
  clientRut: string | null;
  /** Client of the app the document is linked to */
  clientId: number | null;
  client: { id: number; name: string; identifier: string } | null;
  /** How it was linked: by RUT, by name, or chosen by hand */
  clientMatch: 'rut' | 'nombre' | 'manual' | null;
  currency: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  referenceNumber: string | null;
  source: 'carpeta' | 'manual';
  fileName: string;
  mimeType: string;
  fileSize: number;
  needsReview: boolean;
  createdAt: string;
}

export interface BillingSummaryRow {
  currency: string;
  invoiceCount: number;
  invoiceTotal: number;
  creditNoteCount: number;
  creditNoteTotal: number;
  net: number;
}

export type BillingSort = 'numero_desc' | 'numero_asc' | 'fecha_desc';

export const BILLING_SORT_LABELS: Record<BillingSort, string> = {
  numero_desc: 'N.º correlativo, último primero',
  numero_asc: 'N.º correlativo, primero arriba',
  fecha_desc: 'Fecha, más reciente primero',
};

export interface BillingFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: BillingDocumentType;
  currency?: BillingCurrency;
  dateFrom?: string;
  dateTo?: string;
  sort?: BillingSort;
  clientId?: number;
}

export interface BillingListResponse {
  data: BillingDocument[];
  meta: PaginationMeta;
  summary: BillingSummaryRow[];
}

export type BillingDocumentInput = Partial<
  Pick<
    BillingDocument,
    'type' | 'series' | 'number' | 'issueDate' | 'clientName' | 'clientRut' | 'clientId' | 'currency' | 'subtotal' | 'tax' | 'total' | 'referenceNumber'
  >
>;

export interface BillingUploadResult {
  created: number;
  duplicates: number;
  skipped: number;
  results: Array<{ status: 'created' | 'duplicate' | 'skipped'; fileName?: string; reason?: string }>;
}

export interface BillingReprocessResult {
  processed: number;
  fixed: number;
  stillNeedReview: number;
  /** Documents that turned out to share type, series and number with another one */
  duplicates: number;
  /** Documents linked to a client of the app in this run */
  linkedClients: number;
}

export const CLIENT_MATCH_LABELS: Record<NonNullable<BillingDocument['clientMatch']>, string> = {
  rut: 'Vinculado por RUT',
  nombre: 'Vinculado por nombre',
  manual: 'Vinculado a mano',
};

/** "A 1234" or "1234"; "Sin número" when it could not be read */
export const formatBillingNumber = (doc: Pick<BillingDocument, 'series' | 'number'>) =>
  doc.number ? [doc.series, doc.number].filter(Boolean).join(' ') : 'Sin número';

export const formatMoney = (value: number | null | undefined, currency?: string | null) => {
  if (value === null || value === undefined) return '-';
  const amount = Number(value).toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currency === 'USD' ? 'US$' : currency === 'UYU' ? '$' : ''} ${amount}`.trim();
};

export const billingService = {
  getAll: async (filters: BillingFilters = {}): Promise<BillingListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const response = await api.get<BillingListResponse & { success: boolean }>(`/billing?${params.toString()}`);
    return response.data;
  },

  upload: async (files: File[]): Promise<BillingUploadResult> => {
    const form = new FormData();
    files.forEach((file) => form.append('file', file, file.name));
    const response = await api.post<ApiResponse<BillingUploadResult>>('/billing/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  update: async (id: number, data: BillingDocumentInput): Promise<BillingDocument> => {
    const response = await api.patch<ApiResponse<BillingDocument>>(`/billing/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/billing/${id}`);
  },

  /** Reads the data again from the stored files: the given documents, or all flagged for review */
  reprocess: async (ids?: number[]): Promise<BillingReprocessResult> => {
    const response = await api.post<ApiResponse<BillingReprocessResult>>('/billing/reprocess', ids ? { ids } : {});
    return response.data.data;
  },

  getFile: async (doc: Pick<BillingDocument, 'id' | 'mimeType'>): Promise<Blob> => {
    const response = await api.get(`/billing/${doc.id}/file`, { responseType: 'blob' });
    return new Blob([response.data], { type: doc.mimeType });
  },
};
