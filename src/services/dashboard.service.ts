import api from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export interface MissingOfferProduct {
  productId: number;
  name: string;
  code: string | null;
  brand: string | null;
}

export interface ClosingLicitation {
  id: number;
  callNumber: string;
  internalNumber: string | null;
  status: string;
  clientName: string | null;
  /** HH:MM in Uruguay. */
  deadlineTime: string;
  closed: boolean;
  quotationId: number | null;
  quotationIdentifier: string | null;
  quotationStatus: 'creada' | 'finalizada' | null;
  missingOffers: MissingOfferProduct[];
}

export interface UnfinishedQuotation {
  id: number;
  quotationIdentifier: string;
  licitationId: number | null;
  callNumber: string | null;
  clientName: string | null;
  itemCount: number;
  /** YYYY-MM-DD and HH:MM in Uruguay. */
  deadlineDay: string | null;
  deadlineTime: string | null;
  overdue: boolean;
}

export interface DashboardAlerts {
  /** YYYY-MM-DD in Uruguay. */
  today: string;
  closingToday: ClosingLicitation[];
  unfinishedQuotations: UnfinishedQuotation[];
}

export const dashboardService = {
  getAlerts: async (): Promise<DashboardAlerts> => {
    const response = await api.get<ApiResponse<DashboardAlerts>>('/dashboard/alerts');
    return response.data.data;
  },
};
