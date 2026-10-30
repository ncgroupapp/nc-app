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

export interface CertificateAlert {
  id: number;
  name: string;
  requiredForRupe: boolean;
  /** YYYY-MM-DD, null when it was never loaded. */
  expiryDate: string | null;
  status: 'por_vencer' | 'vencido' | 'sin_cargar';
  daysLeft: number | null;
}

export interface DashboardAlerts {
  /** YYYY-MM-DD in Uruguay. */
  today: string;
  closingToday: ClosingLicitation[];
  unfinishedQuotations: UnfinishedQuotation[];
  /** Expired, about to expire, or RUPE certificates never loaded. */
  certificates?: CertificateAlert[];
}

export interface MoneyByCurrency {
  UYU: number;
  USD: number;
}

export type OverviewCertificateStatus = 'vigente' | 'por_vencer' | 'vencido' | 'sin_cargar';

export interface DashboardOverview {
  /** YYYY-MM-DD in Uruguay. */
  today: string;
  billing: {
    thisMonth: MoneyByCurrency & { invoices: number; creditNotes: number };
    lastMonth: MoneyByCurrency;
    /** Last 12 months (YYYY-MM), oldest first, net of credit notes. */
    monthly: Array<MoneyByCurrency & { month: string }>;
    yearToDate: MoneyByCurrency;
    creditNotesYear: MoneyByCurrency;
    topClients: Array<MoneyByCurrency & { name: string; documents: number }>;
    latest: Array<{
      id: number;
      type: 'factura' | 'nota_credito';
      series: string | null;
      number: string | null;
      issueDate: string | null;
      clientName: string | null;
      currency: string | null;
      total: number | null;
    }>;
  };
  licitations: {
    active: number;
    closingToday: number;
    closingThisWeek: number;
    createdMonthly: number[];
    adjudicationRate: number | null;
    adjudicationRatePrevious: number | null;
    funnel: { received: number; quoted: number; adjudicated: number; delivered: number };
  };
  margin: { last90Days: number | null; minMargin: number };
  solicitudes: {
    new: number;
    unread: number;
    inProgress: number;
    resolvedThisMonth: number;
    avgResponseMinutes: number | null;
    lastReceivedAt: string | null;
    latest: Array<{
      id: number;
      subject: string | null;
      fromName: string | null;
      fromEmail: string | null;
      receivedAt: string;
      status: 'nueva' | 'en_proceso';
      unread: boolean;
      assignee: string | null;
      attachments: number;
    }>;
  };
  certificates: Array<{ id: number; name: string; status: OverviewCertificateStatus; daysLeft: number | null }>;
}

export const dashboardService = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await api.get<ApiResponse<DashboardOverview>>('/dashboard/overview');
    return response.data.data;
  },

  getAlerts: async (): Promise<DashboardAlerts> => {
    const response = await api.get<ApiResponse<DashboardAlerts>>('/dashboard/alerts');
    return response.data.data;
  },
};
