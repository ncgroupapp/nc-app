import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  LucideIcon 
} from "lucide-react";
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
      return { icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-100", label: "En espera" };
    case LicitationStatus.QUOTED:
      return { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100", label: "Cotizada" };
    case LicitationStatus.PARTIAL_ADJUDICATION:
      return { icon: AlertCircle, color: "text-orange-600", bgColor: "bg-orange-100", label: "Adjudicación Parcial" };
    case LicitationStatus.NOT_ADJUDICATED:
      return { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100", label: "No Adjudicada" };
    case LicitationStatus.TOTAL_ADJUDICATION:
      return { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Adjudicación Total" };
    default:
      return { icon: Clock, color: "text-gray-600", bgColor: "bg-gray-100", label: status };
  }
};

export const getAwardStatusBadge = (status: QuotationAwardStatus): AwardStatusBadge => {
  switch (status) {
    case QuotationAwardStatus.AWARDED:
      return { color: "bg-green-100 text-green-700", label: "Adjudicado" };
    case QuotationAwardStatus.NOT_AWARDED:
      return { color: "bg-red-100 text-red-700", label: "No Adjudicado" };
    case QuotationAwardStatus.PENDING:
    default:
      return { color: "bg-yellow-100 text-yellow-700", label: "En Espera" };
  }
};

export const getStatusParams = (status: string): StatusParams => {
  switch (status) {
    case QuotationAwardStatus.AWARDED:
      return { label: 'Adjudicado', color: 'bg-green-100 text-green-800 hover:bg-green-100' };
    case QuotationAwardStatus.PARTIALLY_AWARDED:
      return { label: 'Parcial', color: 'bg-blue-100 text-blue-800 hover:bg-blue-100' };
    case QuotationAwardStatus.NOT_AWARDED:
      return { label: 'No Adjudicada', color: 'bg-red-100 text-red-800 hover:bg-red-100' };
    default:
      return { label: 'En Espera', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' };
  }
};
