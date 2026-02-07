"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { LicitationStatus } from "@/services/licitaciones.service";
import { QuotationStatus } from "@/types";

// Local imports
import { useLicitationDetail, useQuotationActions, useAdjudicationActions } from "./hooks";
import {
  LicitationHeader,
  LicitationInfoCard,
  RequestedProductsTab,
  QuotationTab,
  DeliveryTab,
  CreateQuotationDialog,
  EditItemDialog,
  AwardDialog,
  RejectDialog,
} from "./components";

export default function LicitacionDetailPage() {
  const params = useParams();
  const licitationId = parseInt(params.id as string);

  // Load data using custom hook
  const {
    licitation,
    quotation,
    adjudications,
    loading,
    error,
    setQuotation,
    setError,
    loadData,
  } = useLicitationDetail(licitationId);

  // Quotation actions hook
  const quotationActions = useQuotationActions(
    licitation,
    licitationId,
    quotation,
    setQuotation,
    setError
  );

  // Adjudication actions hook
  const adjudicationActions = useAdjudicationActions(
    quotation,
    licitationId,
    loadData,
    setError,
    quotation?.status === QuotationStatus.FINALIZED
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando licitación...</span>
      </div>
    );
  }

  // Not found state
  if (!licitation) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Licitación no encontrada</p>
        <Link href="/dashboard/licitaciones">
          <Button className="mt-4">Volver al listado</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
        </div>
      )}
      
      {/* Header */}
      <LicitationHeader licitation={licitation} />

      {/* General Info Card */}
      <LicitationInfoCard licitation={licitation} />

      {/* Tabs */}
      <Tabs defaultValue="productos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="productos">Productos Solicitados</TabsTrigger>
          <TabsTrigger value="cotizacion">Cotización</TabsTrigger>
          <TabsTrigger value="entrega">Entrega de Productos</TabsTrigger>
        </TabsList>

        {/* Tab: Productos Solicitados */}
        <TabsContent value="productos" className="space-y-4">
          <RequestedProductsTab licitationProducts={licitation.licitationProducts} />
        </TabsContent>

        {/* Tab: Cotización */}
        <TabsContent value="cotizacion" className="space-y-4">
          <QuotationTab
            quotation={quotation}
            submitting={quotationActions.submitting || adjudicationActions.submitting}
            onOpenCreateQuotation={quotationActions.handleOpenCreateQuotationDialog}
            isQuotationDialogOpen={quotationActions.isQuotationDialogOpen}
            setIsQuotationDialogOpen={quotationActions.setIsQuotationDialogOpen}
            newItemData={quotationActions.newItemData}
            setNewItemData={quotationActions.setNewItemData}
            onAddItem={quotationActions.handleAddItemToQuotation}
            onEditItem={quotationActions.handleEditItem}
            onStatusChange={adjudicationActions.handleStatusChange}
            onOpenAward={adjudicationActions.handleOpenAward}
            onOpenReject={adjudicationActions.handleOpenReject}
            onEditAwardedQuantity={adjudicationActions.handleEditAwardedQuantity}
            onFinalize={quotationActions.handleFinalizeQuotation}
            onDownloadPdf={quotationActions.handleDownloadPdf}
          />
        </TabsContent>

        {/* Tab: Entrega */}
        <TabsContent value="entrega" className="space-y-4">
          <DeliveryTab 
            licitationId={licitationId}
            licitationStatus={licitation.status as LicitationStatus} 
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateQuotationDialog
        open={quotationActions.isCreateQuotationDialogOpen}
        onOpenChange={quotationActions.setIsCreateQuotationDialogOpen}
        licitation={licitation}
        data={quotationActions.createQuotationData}
        setData={quotationActions.setCreateQuotationData}
        onConfirm={quotationActions.handleConfirmCreateQuotation}
        submitting={quotationActions.submitting}
      />

      <EditItemDialog
        open={quotationActions.isEditItemDialogOpen}
        onOpenChange={quotationActions.setIsEditItemDialogOpen}
        data={quotationActions.newItemData}
        setData={quotationActions.setNewItemData}
        onSave={quotationActions.handleUpdateItem}
        submitting={quotationActions.submitting}
      />

      <AwardDialog
        open={adjudicationActions.isAwardDialogOpen}
        onOpenChange={adjudicationActions.setIsAwardDialogOpen}
        item={adjudicationActions.awardingItem}
        awardQuantity={adjudicationActions.awardQuantity}
        setAwardQuantity={adjudicationActions.setAwardQuantity}
        isFullAward={adjudicationActions.isFullAward}
        onConfirm={adjudicationActions.handleConfirmAward}
        submitting={adjudicationActions.submitting}
      />

      <RejectDialog
        open={adjudicationActions.isRejectDialogOpen}
        onOpenChange={adjudicationActions.setIsRejectDialogOpen}
        competitorData={adjudicationActions.competitorData}
        setCompetitorData={adjudicationActions.setCompetitorData}
        onConfirm={adjudicationActions.handleConfirmReject}
        submitting={adjudicationActions.submitting}
      />

      {/* Edit Awarded Quantity Dialog */}
      <AwardDialog
        open={adjudicationActions.isEditAwardedDialogOpen}
        onOpenChange={adjudicationActions.setIsEditAwardedDialogOpen}
        item={adjudicationActions.editingAwardedItem}
        awardQuantity={adjudicationActions.awardQuantity}
        setAwardQuantity={adjudicationActions.setAwardQuantity}
        isFullAward={false}
        onConfirm={adjudicationActions.handleConfirmEditAwardedQuantity}
        submitting={adjudicationActions.submitting}
      />
    </div>
  );
}
