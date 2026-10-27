import api from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export const PROFITABILITY_STATUSES = ['abierta', 'presentada', 'adjudicada', 'perdida', 'cerrada'] as const;
export type ProfitabilityStatus = typeof PROFITABILITY_STATUSES[number];

export const PROFITABILITY_STATUS_LABELS: Record<ProfitabilityStatus, string> = {
  abierta: 'Abierta',
  presentada: 'Presentada',
  adjudicada: 'Adjudicada',
  perdida: 'Perdida',
  cerrada: 'Cerrada',
};

export interface ProfitabilitySettings {
  /** Pesos uruguayos por 1 dólar; null hasta que se cargue. */
  exchangeRate: number | null;
  minMargin: number;
  updatedAt: string | null;
}

/** ok: tiene oferta y los montos se pueden pasar a USD. */
export type ProfitabilityItemState = 'ok' | 'sin_oferta' | 'sin_conversion';

export interface ProfitabilityItem {
  id: number;
  productId: number | null;
  productName: string;
  productCode: string | null;
  quantity: number;
  offerId: number | null;
  providerName: string | null;
  offerDate: string | null;
  unitCost: number | null;
  costCurrency: string | null;
  unitCostUsd: number | null;
  unitSale: number;
  saleCurrency: string;
  unitSaleUsd: number | null;
  saleUsd: number | null;
  costUsd: number | null;
  profitUsd: number | null;
  margin: number | null;
  markup: number | null;
  state: ProfitabilityItemState;
}

export interface ProfitabilityTotals {
  offeredUsd: number;
  costedSaleUsd: number;
  costUsd: number;
  profitUsd: number;
  margin: number | null;
  markup: number | null;
}

export interface ProfitabilityLicitation extends ProfitabilityTotals {
  id: number;
  callNumber: string;
  internalNumber: string | null;
  clientId: number;
  clientName: string;
  startDate: string;
  deadlineDate: string;
  status: ProfitabilityStatus;
  quotationId: number | null;
  quotationIdentifier: string | null;
  itemsWithoutOffer: number;
  itemsWithoutConversion: number;
  belowMinMargin: boolean;
  items: ProfitabilityItem[];
}

export interface ProfitabilityReport {
  settings: ProfitabilitySettings;
  summary: ProfitabilityTotals & {
    licitations: number;
    itemsWithoutOffer: number;
    itemsWithoutConversion: number;
    belowMinMargin: number;
  };
  licitations: ProfitabilityLicitation[];
}

export interface ProfitabilityFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: ProfitabilityStatus;
  clientId?: number;
  product?: string;
  search?: string;
}

/** Pasa un monto a USD con el tipo de cambio fijo; null si no se puede (otra moneda o sin tipo de cambio). */
export function toUsd(amount: number, currency: string | null | undefined, exchangeRate: number | null): number | null {
  if (currency === 'USD') return amount;
  if (currency === 'UYU' && exchangeRate) return amount / exchangeRate;
  return null;
}

export const rentabilidadService = {
  getReport: async (filters: ProfitabilityFilters = {}): Promise<ProfitabilityReport> => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params.append(key, String(value));
    }
    const response = await api.get<ApiResponse<ProfitabilityReport>>(`/profitability?${params.toString()}`);
    return response.data.data;
  },

  getSettings: async (): Promise<ProfitabilitySettings> => {
    const response = await api.get<ApiResponse<ProfitabilitySettings>>('/profitability/settings');
    return response.data.data;
  },

  updateSettings: async (settings: { exchangeRate: number; minMargin: number }): Promise<ProfitabilitySettings> => {
    const response = await api.put<ApiResponse<ProfitabilitySettings>>('/profitability/settings', settings);
    return response.data.data;
  },
};
