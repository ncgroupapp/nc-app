"use client";

import { useState } from "react";
import { Quotation, QuotationItem } from "@/services/cotizaciones.service";
import { adjudicacionesService, CreateAdjudicationDto } from "@/services/adjudicaciones.service";
import { QuotationAwardStatus, AdjudicationStatus } from "@/types";

export interface CompetitorData {
  winnerName: string;
  winnerPrice: number;
  notes: string;
  winnerRut: string;
}

export interface UseAdjudicationActionsReturn {
  submitting: boolean;
  
  // Award dialog
  awardingItem: QuotationItem | null;
  isAwardDialogOpen: boolean;
  setIsAwardDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  awardQuantity: number;
  setAwardQuantity: React.Dispatch<React.SetStateAction<number>>;
  isFullAward: boolean;
  handleOpenAward: (item: QuotationItem, isTotal?: boolean) => void;
  handleConfirmAward: () => Promise<void>;
  
  // Reject dialog
  rejectingItem: QuotationItem | null;
  isRejectDialogOpen: boolean;
  setIsRejectDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  competitorData: CompetitorData;
  setCompetitorData: React.Dispatch<React.SetStateAction<CompetitorData>>;
  handleOpenReject: (item: QuotationItem) => void;
  handleConfirmReject: () => Promise<void>;
  
  // Status change handler
  handleStatusChange: (item: QuotationItem, status: QuotationAwardStatus) => void;
}

const initialCompetitorData: CompetitorData = {
  winnerName: '',
  winnerPrice: 0,
  notes: '',
  winnerRut: ''
};

export const useAdjudicationActions = (
  quotation: Quotation | null,
  licitationId: number,
  loadData: () => Promise<void>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  isQuotationFinalized: boolean
): UseAdjudicationActionsReturn => {
  const [submitting, setSubmitting] = useState(false);
  
  // Award dialog state
  const [awardingItem, setAwardingItem] = useState<QuotationItem | null>(null);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [awardQuantity, setAwardQuantity] = useState<number>(0);
  const [isFullAward, setIsFullAward] = useState(false);
  
  // Reject dialog state
  const [rejectingItem, setRejectingItem] = useState<QuotationItem | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [competitorData, setCompetitorData] = useState<CompetitorData>(initialCompetitorData);

  const handleOpenAward = (item: QuotationItem, isTotal: boolean = false) => {
    setAwardingItem(item);
    setAwardQuantity(item.quantity);
    setIsFullAward(isTotal);
    setIsAwardDialogOpen(true);
  };

  const handleConfirmAward = async () => {
    if (!quotation || !awardingItem) return;
    
    try {
      setSubmitting(true);
      
      const status = isFullAward || awardQuantity >= awardingItem.quantity ? 'total' : 'parcial';

      const adjudicationData: CreateAdjudicationDto = {
        quotationId: quotation.id,
        licitationId: licitationId,
        status: status as AdjudicationStatus,
        items: [{
          productId: awardingItem.productId || undefined,
          quantity: awardQuantity,
          unitPrice: awardingItem.priceWithoutIVA
        }],
        nonAwardedItems: []
      };
      
      await adjudicacionesService.create(adjudicationData);
      await loadData();
      
      setIsAwardDialogOpen(false);
      setAwardingItem(null);
      
    } catch (err) {
      console.error('Error awarding item:', err);
      setError('Error al adjudicar item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = (item: QuotationItem) => {
    setRejectingItem(item);
    setCompetitorData(initialCompetitorData);
    setIsRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!quotation || !rejectingItem) return;
    
    try {
      setSubmitting(true);
      
      const adjudicationData: CreateAdjudicationDto = {
        quotationId: quotation.id,
        licitationId: licitationId,
        status: AdjudicationStatus.PARTIAL,
        items: [],
        nonAwardedItems: [{
          productId: rejectingItem.productId || undefined,
          competitorName: competitorData.winnerName,
          competitorRut: competitorData.winnerRut || 'N/A',
          competitorPrice: competitorData.winnerPrice,
          competitorBrand: 'N/A'
        }]
      };
      
      await adjudicacionesService.create(adjudicationData);
      await loadData();
      
      setIsRejectDialogOpen(false);
      setRejectingItem(null);
    } catch (err) {
      console.error('Error rejecting item:', err);
      setError('Error al rechazar item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (item: QuotationItem, status: QuotationAwardStatus) => {
    if (isQuotationFinalized) return;

    if (status === QuotationAwardStatus.AWARDED) {
      handleOpenAward(item, true);
    } else if (status === QuotationAwardStatus.PARTIALLY_AWARDED) {
      handleOpenAward(item, false);
    } else if (status === QuotationAwardStatus.NOT_AWARDED) {
      handleOpenReject(item);
    }
  };

  return {
    submitting,
    awardingItem,
    isAwardDialogOpen,
    setIsAwardDialogOpen,
    awardQuantity,
    setAwardQuantity,
    isFullAward,
    handleOpenAward,
    handleConfirmAward,
    rejectingItem,
    isRejectDialogOpen,
    setIsRejectDialogOpen,
    competitorData,
    setCompetitorData,
    handleOpenReject,
    handleConfirmReject,
    handleStatusChange
  };
};
