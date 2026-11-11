import api from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export interface CollectionInvoice {
  id: number;
  /** "A-1203" */
  label: string;
  issueDate: string | null;
  currency: string | null;
  net: number;
  tax: number;
  total: number;
  clientId: number | null;
  clientName: string | null;
  clientRut: string | null;
}

export interface ProfitPartner {
  name: string;
  /** % of the profit */
  share: number;
}

export interface CollectionTotals {
  net: number;
  salesTax: number;
  invoiced: number;
  profit: number;
  margin: number | null;
  markup: number | null;
  taxToPay: number;
  /** Amount received minus the invoices total */
  difference: number;
  partners: Array<ProfitPartner & { amount: number }>;
}

export type ClientKind = 'publico' | 'privado';

export interface Collection {
  id: number;
  /** "CB-0001" */
  number: string;
  date: string;
  clientId: number | null;
  clientName: string;
  clientRut: string | null;
  clientKind: ClientKind;
  currency: string;
  amountReceived: number;
  bank: string | null;
  reference: string | null;
  cost: number;
  purchaseTax: number;
  licitation: { id: number; callNumber: string; internalNumber: string | null } | null;
  notes: string | null;
  invoices: CollectionInvoice[];
  totals: CollectionTotals;
  createdAt: string;
}

export interface CollectionForm {
  date: string;
  amountReceived: number;
  bank?: string | null;
  reference?: string | null;
  cost?: number;
  purchaseTax?: number;
  licitationId?: number | null;
  notes?: string | null;
  invoiceIds: number[];
}

/** Uruguayan VAT rate applied by default to the purchase cost */
export const PURCHASE_VAT = 0.22;

export const collectionsService = {
  getAll: async (): Promise<{ items: Collection[]; partners: ProfitPartner[] }> => {
    const response = await api.get<ApiResponse<{ items: Collection[]; partners: ProfitPartner[] }>>('/collections');
    return response.data.data;
  },

  pendingInvoices: async (filters: { clientId?: number; collectionId?: number } = {}): Promise<CollectionInvoice[]> => {
    const params = new URLSearchParams();
    if (filters.clientId) params.append('clientId', String(filters.clientId));
    if (filters.collectionId) params.append('collectionId', String(filters.collectionId));
    const response = await api.get<ApiResponse<CollectionInvoice[]>>(`/collections/pending-invoices?${params.toString()}`);
    return response.data.data;
  },

  create: async (data: CollectionForm): Promise<Collection> => {
    const response = await api.post<ApiResponse<Collection>>('/collections', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CollectionForm>): Promise<Collection> => {
    const response = await api.patch<ApiResponse<Collection>>(`/collections/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/collections/${id}`);
  },

  /** Downloads the collection PDF */
  downloadPdf: async (collection: Pick<Collection, 'id' | 'number' | 'clientName'>): Promise<void> => {
    const response = await api.get(`/collections/${collection.id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cobranza ${collection.number} - ${collection.clientName}.pdf`.replace(/[\\/:*?"<>|]/g, ' ');
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

/** Same math as the backend, for the live preview in the dialog (cents of the split go to the first partner) */
export function previewTotals(
  invoices: CollectionInvoice[],
  cost: number,
  purchaseTax: number,
  amountReceived: number,
  partners: ProfitPartner[],
): CollectionTotals {
  const round2 = (v: number) => Math.round(v * 100) / 100;
  const net = round2(invoices.reduce((s, i) => s + i.net, 0));
  const salesTax = round2(invoices.reduce((s, i) => s + i.tax, 0));
  const invoiced = round2(invoices.reduce((s, i) => s + i.total, 0));
  const profit = round2(net - cost);
  const split = partners.map((p) => ({ ...p, amount: round2((profit * p.share) / 100) }));
  const spread = round2(profit - split.reduce((s, p) => s + p.amount, 0));
  if (split.length && spread !== 0) split[0].amount = round2(split[0].amount + spread);
  return {
    net,
    salesTax,
    invoiced,
    profit,
    margin: net > 0 ? (profit / net) * 100 : null,
    markup: cost > 0 ? (profit / cost) * 100 : null,
    taxToPay: round2(salesTax - purchaseTax),
    difference: round2(amountReceived - invoiced),
    partners: split,
  };
}

export const money = (value: number, decimals = 2) =>
  value.toLocaleString('es-UY', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
export const percent = (value: number | null) =>
  value === null ? '—' : `${value.toLocaleString('es-UY', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
export const shortDate = (iso: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');
