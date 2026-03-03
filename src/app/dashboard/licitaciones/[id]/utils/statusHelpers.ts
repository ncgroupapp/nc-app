import { AlertCircle, CheckCircle, Clock, FileText, Lucide as LucideIcon, XCircle } from "lucide-react";
import { LicitationStatus } from "@/services/licitaciones.service";
import { QuotationAwardStatus } from "@/types";

export interface EstadoInfo {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  label: string;
}

export interface AwardStatusBadge {
  color: string;
  label: string;
}

export interface StatusParams {
  label: string;
  color: string;
}

export const getEstadoInfo = (status: LicitationStatus): EstadoInfo => {
  switch (status) {
    case LicitationStatus.PENDING:
      return { icon: Clock, color: "text-yellow-500", bgColor: "bg-yellow-500/10 border border-yellow-500/20", label: "En espera" };
    case LicitationStatus.QUOTED:
      return { icon: FileText, color: "text-blue-500", bgColor: "bg-blue-500/10 border border-blue-500/20", label: "Cotizada" };
    case LicitationStatus.PARTIAL_ADJUDICATION:
      return { icon: AlertCircle, color: "text-orange-500", bgColor: "bg-orange-500/10 border border-orange-500/20", label: "Adjudicación Parcial" };
    case LicitationStatus.NOT_ADJUDICATED:
      return { icon: XCircle, color: "text-red-500", bgColor: "bg-red-500/10 border border-red-500/20", label: "No Adjudicada" };
    case LicitationStatus.TOTAL_ADJUDICATION:
      return { icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10 border border-green-500/20", label: "Adjudicación Total" };
    default:
      return { icon: Clock, color: "text-muted-foreground", bgColor: "bg-muted border border-border", label: status };
  }
};

export const getAwardStatusBadge = (status: QuotationAwardStatus): AwardStatusBadge => {
  switch (status) {
    case QuotationAwardStatus.AWARDED:
      return { color: "bg-green-500/10 text-green-500 border-green-500/20", label: "Adjudicado" };
    case QuotationAwardStatus.NOT_AWARDED:
      return { color: "bg-red-500/10 text-red-500 border-red-500/20", label: "No Adjudicado" };
    case QuotationAwardStatus.PENDING:
    default:
      return { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "En Espera" };
  }
};

export const getStatusParams = (status: string): StatusParams => {
  switch (status) {
    case QuotationAwardStatus.AWARDED:
      return { label: 'Adjudicado', color: 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20' };
    case QuotationAwardStatus.PARTIALLY_AWARDED:
      return { label: 'Parcial', color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20' };
    case QuotationAwardStatus.NOT_AWARDED:
      return { label: 'No Adjudicada', color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' };
    default:
      return { label: 'En Espera', color: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20' };
  }
};