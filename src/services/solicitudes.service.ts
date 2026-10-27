import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export enum SolicitudStatus {
  NEW = 'nueva',
  IN_PROGRESS = 'en_proceso',
  RESOLVED = 'resuelta',
  CANCELLED = 'cancelada',
}

export const SOLICITUD_STATUS_LABELS: Record<SolicitudStatus, string> = {
  [SolicitudStatus.NEW]: 'Nueva',
  [SolicitudStatus.IN_PROGRESS]: 'En proceso',
  [SolicitudStatus.RESOLVED]: 'Resuelta',
  [SolicitudStatus.CANCELLED]: 'Cancelada',
};

export const SOLICITUD_STATUS_CLASSES: Record<SolicitudStatus, string> = {
  [SolicitudStatus.NEW]: 'bg-[#E8F2FA] text-brand-blue border-[#CFE3F4]',
  [SolicitudStatus.IN_PROGRESS]: 'bg-amber-50 text-amber-700 border-amber-100',
  [SolicitudStatus.RESOLVED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  [SolicitudStatus.CANCELLED]: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

export interface SolicitudAttachment {
  id: number;
  filename: string;
  mimeType: string | null;
  size: number;
}

export interface SolicitudMessage {
  id: number;
  fromName: string | null;
  fromEmail: string | null;
  toRecipients: string | null;
  ccRecipients: string | null;
  subject: string | null;
  sentAt: string;
  bodyText: string | null;
  bodyHtml: string | null;
  outgoing: boolean;
  attachments: SolicitudAttachment[];
}

export interface Solicitud {
  id: number;
  mailAccount?: { id: number; email: string };
  subject: string | null;
  fromName: string | null;
  fromEmail: string | null;
  receivedAt: string;
  lastMessageAt: string;
  messagesCount: number;
  snippet: string | null;
  status: SolicitudStatus;
  assignee: string | null;
  notes: string | null;
  unread: boolean;
  messages?: SolicitudMessage[];
}

export interface SolicitudesSummary {
  total: number;
  unread: number;
  byStatus: Record<SolicitudStatus, number>;
}

export interface MailAccount {
  id: number;
  email: string;
  labelName: string;
  active: boolean;
  needsReconnect: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
}

export interface SolicitudesFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: SolicitudStatus;
  from?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UpdateSolicitudForm {
  status?: SolicitudStatus;
  assignee?: string | null;
  notes?: string | null;
}

export const solicitudesService = {
  getAll: async (filters: SolicitudesFilters = {}): Promise<PaginatedResponse<Solicitud>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    });
    const response = await api.get<PaginatedResponse<Solicitud>>(`/solicitudes?${params.toString()}`);
    return response.data;
  },

  getSummary: async (): Promise<SolicitudesSummary> => {
    const response = await api.get<ApiResponse<SolicitudesSummary>>('/solicitudes/summary');
    return response.data.data;
  },

  getById: async (id: number): Promise<Solicitud> => {
    const response = await api.get<ApiResponse<Solicitud>>(`/solicitudes/${id}`);
    return response.data.data;
  },

  update: async (id: number, data: UpdateSolicitudForm): Promise<Solicitud> => {
    const response = await api.patch<ApiResponse<Solicitud>>(`/solicitudes/${id}`, data);
    return response.data.data;
  },

  getMailAccounts: async (): Promise<{ configured: boolean; accounts: MailAccount[] }> => {
    const response = await api.get<ApiResponse<{ configured: boolean; accounts: MailAccount[] }>>('/solicitudes/mail/accounts');
    return response.data.data;
  },

  getConnectUrl: async (email?: string): Promise<string> => {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const response = await api.get<ApiResponse<{ url: string }>>(`/solicitudes/mail/connect${query}`);
    return response.data.data.url;
  },

  syncNow: async (accountId: number): Promise<{ imported: number; updated: number }> => {
    const response = await api.post<ApiResponse<{ imported: number; updated: number }>>(
      `/solicitudes/mail/accounts/${accountId}/sync`,
    );
    return response.data.data;
  },

  disconnect: async (accountId: number): Promise<void> => {
    await api.delete(`/solicitudes/mail/accounts/${accountId}`);
  },

  /** Downloads an attachment through the API (it needs the auth header) and saves it. */
  downloadAttachment: async (attachment: SolicitudAttachment): Promise<void> => {
    const response = await api.get<Blob>(`/solicitudes/attachments/${attachment.id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-UY', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Guesses the purchase number from a request subject, e.g.
 * "INVITACION A OFERTAR D196925" → "D196925", "CD 2026 1698" → "CD 2026 1698",
 * "PEDIDO DE PRECIO SM 6207" → "SM 6207". Returns "" when nothing looks like one.
 */
export function extractCallNumber(subject: string | null): string {
  if (!subject) return '';
  const patterns = [
    /\b(D\d{5,})\b/i,
    /\b(CD\s*\d{4}\s*[-/]?\s*\d+)\b/i,
    /\b(SM\s*\d+)\b/i,
    /\b((?:LA|LP|CE)\s*\d+(?:\s*[-/]\s*\d+)?)\b/i,
    /(?:N[º°o]\.?|n[uú]mero)\s*(\d+\s*(?:[-/]|de)\s*\d{4})/i,
  ];
  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match?.[1]) return match[1].replace(/\s+/g, ' ').trim().toUpperCase();
  }
  return '';
}

/** Link that opens "Nueva licitación" prefilled with the data of a request. */
export function buildLicitacionUrl(solicitud: Pick<Solicitud, 'id' | 'subject' | 'fromEmail' | 'receivedAt'>): string {
  const params = new URLSearchParams({ nueva: '1', solicitud: String(solicitud.id) });
  const callNumber = extractCallNumber(solicitud.subject);
  if (callNumber) params.set('numero', callNumber);
  if (solicitud.fromEmail) params.set('email', solicitud.fromEmail);
  params.set('fecha', solicitud.receivedAt.slice(0, 10));
  return `/dashboard/licitaciones?${params.toString()}`;
}
