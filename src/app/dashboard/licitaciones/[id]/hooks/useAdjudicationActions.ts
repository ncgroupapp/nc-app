"use client";

import { useState } from "react";
import { Quotation, QuotationItem, cotizacionesService } from "@/services/cotizaciones.service";
import { adjudicacionesService, CreateAdjudicationDto } from "@/services/adjudicaciones.service";
import { QuotationAwardStatus, AdjudicationStatus } from "@/types";

export interface CompetitorData {
  winnerName: string;
  winnerPrice: number;
  notes: string;
  winnerRut: string;
  quantity?: number;
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

  // Edit awarded quantity (for partial awards)
  editingAwardedItem: QuotationItem | null;
  isEditAwardedDialogOpen: boolean;
  setIsEditAwardedDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleEditAwardedQuantity: (item: QuotationItem) => void;
  handleConfirmEditAwardedQuantity: () => Promise<void>;

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
  loadData: (silent?: boolean) => Promise<void>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  isQuotationFinalized: boolean,
  setQuotation?: React.Dispatch<React.SetStateAction<Quotation | null>>
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

  // Edit awarded quantity state
  const [editingAwardedItem, setEditingAwardedItem] = useState<QuotationItem | null>(null);
  const [isEditAwardedDialogOpen, setIsEditAwardedDialogOpen] = useState(false);

  // Función auxiliar para actualizar un item específico con rollback
  const updateItemWithRollback = (
    itemId: number,
    updater: (item: QuotationItem) => QuotationItem
  ) => {
    if (!setQuotation) {
      return {
        rollback: () => {}
      };
    }

    // Guardar estado anterior para rollback
    let previousItem: QuotationItem | undefined;
    setQuotation(prevQuotation => {
      if (!prevQuotation) return prevQuotation;

      const item = prevQuotation.items.find(i => i.id === itemId);
      if (!item) return prevQuotation;

      previousItem = { ...item };

      const updatedItems = prevQuotation.items.map(quotationItem => {
        if (quotationItem.id === itemId) {
          return updater(quotationItem);
        }
        return quotationItem;
      });

      return {
        ...prevQuotation,
        items: updatedItems
      };
    });

    return {
      rollback: () => {
        if (previousItem && setQuotation) {
          setQuotation(prevQuotation => {
            if (!prevQuotation) return prevQuotation;

            const revertedItems = prevQuotation.items.map(quotationItem => {
              if (quotationItem.id === itemId) {
                return previousItem!;
              }
              return quotationItem;
            });

            return {
              ...prevQuotation,
              items: revertedItems
            };
          });
        }
      }
    };
  };

  const handleOpenAward = (item: QuotationItem, isTotal: boolean = false) => {
    setAwardingItem(item);
    setAwardQuantity(item.quantity);
    setIsFullAward(isTotal);
    setIsAwardDialogOpen(true);
  };

  const handleConfirmAward = async () => {
    if (!quotation || !awardingItem) return;

    const item = awardingItem;
    const itemId = item.id!; // Los items de cotización siempre tienen ID después de crear
    const newStatus = isFullAward || awardQuantity >= item.quantity
      ? QuotationAwardStatus.AWARDED
      : QuotationAwardStatus.PARTIALLY_AWARDED;

    // Optimistic update
    const { rollback } = updateItemWithRollback(itemId, (quotationItem) => ({
      ...quotationItem,
      awardStatus: newStatus,
      awardedQuantity: awardQuantity
    }));

    try {
      setSubmitting(true);

      const status = isFullAward || awardQuantity >= item.quantity ? 'total' : 'parcial';

      const adjudicationData: CreateAdjudicationDto = {
        quotationId: quotation.id,
        licitationId: licitationId,
        status: status as AdjudicationStatus,
        items: [{
          productId: item.productId || undefined,
          productName: item.productName,
          quantity: awardQuantity,
          unitPrice: item.priceWithoutIVA
        }],
        nonAwardedItems: []
      };

      await adjudicacionesService.create(adjudicationData);

      setIsAwardDialogOpen(false);
      setAwardingItem(null);

    } catch (err) {
      console.error('Error awarding item:', err);
      setError('Error al adjudicar item');
      rollback(); // Revertir optimistic update
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

    const item = rejectingItem;
    const itemId = item.id!; // Los items de cotización siempre tienen ID después de crear

    // Optimistic update
    const { rollback } = updateItemWithRollback(itemId, (quotationItem) => ({
      ...quotationItem,
      awardStatus: QuotationAwardStatus.NOT_AWARDED,
      competitorInfo: {
        winnerName: competitorData.winnerName,
        winnerPrice: competitorData.winnerPrice,
        notes: competitorData.notes
      }
    }));

    try {
      setSubmitting(true);

      const adjudicationData: CreateAdjudicationDto = {
        quotationId: quotation.id,
        licitationId: licitationId,
        status: AdjudicationStatus.PARTIAL,
        items: [],
        nonAwardedItems: [{
          productId: item.productId || undefined,
          competitorName: competitorData.winnerName,
          competitorRut: competitorData.winnerRut || 'N/A',
          competitorPrice: competitorData.winnerPrice,
          competitorBrand: 'N/A',
          quantity: competitorData.quantity || item.quantity
        }]
      };

      await adjudicacionesService.create(adjudicationData);

      setIsRejectDialogOpen(false);
      setRejectingItem(null);

    } catch (err) {
      console.error('Error rejecting item:', err);
      setError('Error al rechazar item');
      rollback(); // Revertir optimistic update
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (item: QuotationItem, status: QuotationAwardStatus) => {
    if (isQuotationFinalized || !quotation) return;

    // Guardar el estado anterior para revertir en caso de error
    const previousStatus = item.awardStatus;

    // Determinar si es una transición que requiere diálogo
    const requiresDialog = (
      (status === QuotationAwardStatus.AWARDED && previousStatus === QuotationAwardStatus.PENDING) ||
      (status === QuotationAwardStatus.PARTIALLY_AWARDED && previousStatus === QuotationAwardStatus.PENDING) ||
      status === QuotationAwardStatus.NOT_AWARDED
    );

    if (requiresDialog) {
      // Mantener el comportamiento original para estados que requieren diálogo
      if (status === QuotationAwardStatus.AWARDED) {
        handleOpenAward(item, true);
      } else if (status === QuotationAwardStatus.PARTIALLY_AWARDED) {
        handleOpenAward(item, false);
      } else if (status === QuotationAwardStatus.NOT_AWARDED) {
        handleOpenReject(item);
      }
      return;
    }

    // Manejar transiciones directas con optimistic update
    try {
      setSubmitting(true);

      // Optimistic update local
      if (setQuotation) {
        setQuotation(prevQuotation => {
          if (!prevQuotation) return prevQuotation;

          const updatedItems = prevQuotation.items.map(quotationItem => {
            if (quotationItem.id === item.id) {
              // Si cambiamos a PENDING, limpiar awardedQuantity
              // Si cambiamos a PARTIALLY_AWARDED desde AWARDED, usar la cantidad anterior
              let newAwardedQuantity: number | undefined;

              if (status === QuotationAwardStatus.PENDING) {
                newAwardedQuantity = undefined;
              } else if (status === QuotationAwardStatus.PARTIALLY_AWARDED) {
                // Si venía de AWARDED, mantener la cantidad adjudicada
                // Si no tenía, usar la cantidad total por defecto
                newAwardedQuantity = item.awardedQuantity || item.quantity;
              }

              return {
                ...quotationItem,
                awardStatus: status,
                awardedQuantity: newAwardedQuantity
              };
            }
            return quotationItem;
          });

          return {
            ...prevQuotation,
            items: updatedItems
          };
        });
      }

      // Llamar al backend
      await cotizacionesService.updateItemAwardStatus(
        quotation.id,
        item.id!,
        status,
        status === QuotationAwardStatus.PARTIALLY_AWARDED ? (item.awardedQuantity || item.quantity) : undefined
      );

    } catch (err) {
      console.error('Error updating item status:', err);
      setError('Error al actualizar el estado del item');

      // Revertir optimistic update en caso de error
      if (setQuotation) {
        setQuotation(prevQuotation => {
          if (!prevQuotation) return prevQuotation;

          const revertedItems = prevQuotation.items.map(quotationItem => {
            if (quotationItem.id === item.id) {
              return {
                ...quotationItem,
                awardStatus: previousStatus
              };
            }
            return quotationItem;
          });

          return {
            ...prevQuotation,
            items: revertedItems
          };
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAwardedQuantity = (item: QuotationItem) => {
    setEditingAwardedItem(item);
    setAwardQuantity(item.awardedQuantity || 0);
    setIsEditAwardedDialogOpen(true);
  };

  const handleConfirmEditAwardedQuantity = async () => {
    if (!editingAwardedItem || !editingAwardedItem.id) return;

    const item = editingAwardedItem;
    const itemId = item.id!; // Ya está validado que existe
    const newQuantity = awardQuantity;

    // Optimistic update
    const { rollback } = updateItemWithRollback(itemId, (quotationItem) => ({
      ...quotationItem,
      awardedQuantity: newQuantity
    }));

    try {
      setSubmitting(true);
      await adjudicacionesService.updateAwardedQuantity(itemId, newQuantity);

      setIsEditAwardedDialogOpen(false);
      setEditingAwardedItem(null);

    } catch (err) {
      console.error('Error updating awarded quantity:', err);
      setError('Error al actualizar la cantidad adjudicada');
      rollback(); // Revertir optimistic update
    } finally {
      setSubmitting(false);
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
    editingAwardedItem,
    isEditAwardedDialogOpen,
    setIsEditAwardedDialogOpen,
    handleEditAwardedQuantity,
    handleConfirmEditAwardedQuantity,
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
