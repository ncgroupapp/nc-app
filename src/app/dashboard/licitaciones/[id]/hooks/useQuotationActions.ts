"use client";

import { useState } from "react";
import { 
  cotizacionesService, 
  Quotation, 
  QuotationItem, 
  CreateQuotationDto 
} from "@/services/cotizaciones.service";
import { Licitation } from "@/services/licitaciones.service";
import { QuotationStatus, QuotationAwardStatus, Currency } from "@/types";

export interface NewItemData {
  productId: string;
  productName: string;
  brand: string;
  origin: string;
  quantity: number;
  priceWithoutIVA: number;
  ivaPercentage: number;
  deliveryTime: number;
  inStock: boolean;
  currency: Currency;
}

export interface CreateQuotationData {
  quotationIdentifier: string;
  currency: Currency;
  observations: string;
  paymentForm: string;
  validity: string;
}

export interface UseQuotationActionsReturn {
  submitting: boolean;
  
  // Create quotation dialog
  isCreateQuotationDialogOpen: boolean;
  setIsCreateQuotationDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createQuotationData: CreateQuotationData;
  setCreateQuotationData: React.Dispatch<React.SetStateAction<CreateQuotationData>>;
  handleOpenCreateQuotationDialog: () => void;
  handleConfirmCreateQuotation: () => Promise<void>;
  
  // Add item dialog
  isQuotationDialogOpen: boolean;
  setIsQuotationDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newItemData: NewItemData;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemData>>;
  handleAddItemToQuotation: () => Promise<void>;
  
  // Edit item dialog
  editingItem: QuotationItem | null;
  isEditItemDialogOpen: boolean;
  setIsEditItemDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleEditItem: (item: QuotationItem) => void;
  handleUpdateItem: () => Promise<void>;
  
  // Finalize and PDF
  handleFinalizeQuotation: () => Promise<void>;
  handleDownloadPdf: () => Promise<void>;
}

const initialNewItemData: NewItemData = {
  productId: '',
  productName: '',
  brand: '',
  origin: '',
  quantity: 1,
  priceWithoutIVA: 0,
  ivaPercentage: 22,
  deliveryTime: 15,
  inStock: true,
  currency: Currency.UYU
};

const initialCreateQuotationData: CreateQuotationData = {
  quotationIdentifier: '',
  currency: Currency.UYU,
  observations: '',
  paymentForm: '30 días',
  validity: '15 días'
};

export const useQuotationActions = (
  licitation: Licitation | null,
  licitationId: number,
  quotation: Quotation | null,
  setQuotation: React.Dispatch<React.SetStateAction<Quotation | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): UseQuotationActionsReturn => {
  const [submitting, setSubmitting] = useState(false);
  
  // Create Quotation Modal State
  const [isCreateQuotationDialogOpen, setIsCreateQuotationDialogOpen] = useState(false);
  const [createQuotationData, setCreateQuotationData] = useState<CreateQuotationData>(initialCreateQuotationData);
  
  // Add Item Dialog State
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  const [newItemData, setNewItemData] = useState<NewItemData>(initialNewItemData);
  
  // Edit Item State
  const [editingItem, setEditingItem] = useState<QuotationItem | null>(null);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);

  const handleOpenCreateQuotationDialog = () => {
    if (!licitation) return;
    
    const defaultIdentifier = `COT-${licitation.callNumber}-${Date.now()}`;
    
    setCreateQuotationData({
      quotationIdentifier: defaultIdentifier,
      currency: Currency.UYU,
      observations: '',
      paymentForm: '30 días',
      validity: '15 días'
    });
    
    setIsCreateQuotationDialogOpen(true);
  };

  const handleConfirmCreateQuotation = async () => {
    if (!licitation) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const createData: CreateQuotationDto = {
        quotationIdentifier: createQuotationData.quotationIdentifier,
        licitationId: licitationId,
        status: QuotationStatus.CREATED,
        clientId: licitation.clientId,
        clientName: licitation.client?.name,
        observations: createQuotationData.observations || undefined,
        paymentForm: createQuotationData.paymentForm || undefined,
        validity: createQuotationData.validity || undefined,
        items: licitation.licitationProducts?.map(lp => ({
          productId: lp.product.id,
          productName: lp.product.name,
          inStock: (lp.product.stockQuantity || 0) > 0,
          quantity: lp.quantity,
          priceWithoutIVA: 0.01,
          priceWithIVA: 0.01,
          ivaPercentage: 22,
          currency: createQuotationData.currency,
          awardStatus: QuotationAwardStatus.PENDING
        })) || []
      };
      
      const newQuotation = await cotizacionesService.create(createData);
      setQuotation(newQuotation);
      setIsCreateQuotationDialogOpen(false);
    } catch (err) {
      console.error('Error creating quotation:', err);
      setError('Error al crear la cotización');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddItemToQuotation = async () => {
    if (!quotation) return;
    
    try {
      setSubmitting(true);
      
      const priceWithIVA = newItemData.priceWithoutIVA * (1 + newItemData.ivaPercentage / 100);
      
      const newItem: QuotationItem = {
        productId: newItemData.productId ? parseInt(newItemData.productId) : undefined,
        productName: newItemData.productName,
        brand: newItemData.brand,
        origin: newItemData.origin,
        inStock: newItemData.inStock,
        quantity: newItemData.quantity,
        priceWithoutIVA: newItemData.priceWithoutIVA,
        priceWithIVA: priceWithIVA,
        ivaPercentage: newItemData.ivaPercentage,
        currency: newItemData.currency,
        deliveryTime: newItemData.deliveryTime,
        awardStatus: QuotationAwardStatus.PENDING,
      };
      
      const updatedQuotation = await cotizacionesService.update(quotation.id, {
        items: [...quotation.items, newItem]
      });
      
      setQuotation(updatedQuotation);
      setIsQuotationDialogOpen(false);
      setNewItemData(initialNewItemData);
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Error al agregar item a la cotización');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditItem = (item: QuotationItem) => {
    setEditingItem(item);
    setNewItemData({
      productId: item.productId?.toString() || '',
      productName: item.productName,
      brand: item.brand || '',
      origin: item.origin || '',
      quantity: item.quantity,
      priceWithoutIVA: item.priceWithoutIVA,
      ivaPercentage: item.ivaPercentage,
      deliveryTime: item.deliveryTime || 0,
      inStock: item.inStock,
      currency: item.currency
    });
    setIsEditItemDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!quotation || !editingItem) return;
    
    try {
      setSubmitting(true);
      const priceWithIVA = newItemData.priceWithoutIVA * (1 + newItemData.ivaPercentage / 100);
      
      const updatedItems = quotation.items.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            productId: newItemData.productId ? parseInt(newItemData.productId) : undefined,
            productName: newItemData.productName,
            brand: newItemData.brand,
            origin: newItemData.origin,
            inStock: newItemData.inStock,
            quantity: newItemData.quantity,
            priceWithoutIVA: newItemData.priceWithoutIVA,
            priceWithIVA: newItemData.priceWithoutIVA * (1 + newItemData.ivaPercentage / 100),
            ivaPercentage: newItemData.ivaPercentage,
            currency: newItemData.currency,
            deliveryTime: newItemData.deliveryTime,
          };
        }
        return item;
      });
      
      const updatedQuotation = await cotizacionesService.update(quotation.id, {
        items: updatedItems
      });
      
      setQuotation(updatedQuotation);
      setIsEditItemDialogOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Error al actualizar item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeQuotation = async () => {
    if (!quotation) return;
    
    try {
      setSubmitting(true);
      const finalized = await cotizacionesService.finalize(quotation.id);
      setQuotation(finalized);
    } catch (err) {
      console.error('Error finalizing quotation:', err);
      setError('Error al finalizar la cotización');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!quotation) return;
    
    try {
      const blob = await cotizacionesService.downloadPdf(quotation.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion_${quotation.quotationIdentifier}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Error al descargar el PDF');
    }
  };

  return {
    submitting,
    isCreateQuotationDialogOpen,
    setIsCreateQuotationDialogOpen,
    createQuotationData,
    setCreateQuotationData,
    handleOpenCreateQuotationDialog,
    handleConfirmCreateQuotation,
    isQuotationDialogOpen,
    setIsQuotationDialogOpen,
    newItemData,
    setNewItemData,
    handleAddItemToQuotation,
    editingItem,
    isEditItemDialogOpen,
    setIsEditItemDialogOpen,
    handleEditItem,
    handleUpdateItem,
    handleFinalizeQuotation,
    handleDownloadPdf
  };
};
