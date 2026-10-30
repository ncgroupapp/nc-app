import api from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export type CertificateStatus = 'vigente' | 'por_vencer' | 'vencido' | 'sin_cargar';

export const CERTIFICATE_STATUS_LABELS: Record<CertificateStatus, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  sin_cargar: 'Sin cargar',
};

export const CERTIFICATE_STATUS_CLASSES: Record<CertificateStatus, string> = {
  vigente: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  por_vencer: 'bg-amber-100 text-amber-800 border-amber-200',
  vencido: 'bg-red-100 text-red-700 border-red-200',
  sin_cargar: 'bg-slate-100 text-slate-700 border-slate-200',
};

export interface CertificateInput {
  name: string;
  issuer?: string | null;
  description?: string | null;
  requiredForRupe?: boolean;
  /** YYYY-MM-DD */
  issueDate?: string | null;
  /** YYYY-MM-DD */
  expiryDate?: string | null;
  alertDays?: number;
  notes?: string | null;
}

export interface Certificate extends CertificateInput {
  id: number;
  /** Set for the built-in RUPE certificates, which cannot be deleted */
  code: string | null;
  requiredForRupe: boolean;
  alertDays: number;
  issueDate: string | null;
  expiryDate: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  status: CertificateStatus;
  /** Days until it expires, negative once expired */
  daysLeft: number | null;
  updatedAt: string;
}

/** "Vence en 12 días", "Venció hace 3 días", "Vence hoy" */
export const describeExpiry = (certificate: Pick<Certificate, 'status' | 'daysLeft'>) => {
  const days = certificate.daysLeft;
  if (days === null) return 'Falta cargar el vencimiento';
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  if (days > 0) return `Vence en ${days} días`;
  return days === -1 ? 'Venció ayer' : `Venció hace ${-days} días`;
}

export const certificatesService = {
  getAll: async (): Promise<Certificate[]> => {
    const response = await api.get<ApiResponse<Certificate[]>>('/certificates');
    return response.data.data;
  },

  create: async (data: CertificateInput): Promise<Certificate> => {
    const response = await api.post<ApiResponse<Certificate>>('/certificates', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CertificateInput>): Promise<Certificate> => {
    const response = await api.patch<ApiResponse<Certificate>>(`/certificates/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/certificates/${id}`);
  },

  uploadFile: async (id: number, file: File): Promise<Certificate> => {
    const form = new FormData();
    form.append('file', file, file.name);
    const response = await api.post<ApiResponse<Certificate>>(`/certificates/${id}/file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  removeFile: async (id: number): Promise<Certificate> => {
    const response = await api.delete<ApiResponse<Certificate>>(`/certificates/${id}/file`);
    return response.data.data;
  },

  getFile: async (certificate: Pick<Certificate, 'id' | 'mimeType'>): Promise<Blob> => {
    const response = await api.get(`/certificates/${certificate.id}/file`, { responseType: 'blob' });
    return new Blob([response.data], { type: certificate.mimeType ?? 'application/pdf' });
  },
};
