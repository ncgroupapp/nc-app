"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LicitationStatus } from "@/services/licitaciones.service";
import { QuotationStatus } from "@/types/enums";
import { FadeIn } from "@/components/common/fade-in";
import { useQuotationActions } from "../hooks/useQuotationActions";
import { useAdjudicationActions } from "../hooks/useAdjudicationActions";
import {
  RequestedProductsTab,
  QuotationTab,
  DeliveryTab,
  CreateQuotationDialog,
  EditItemDialog,
  AwardDialog,
  RejectDialog,
} from "../components";

interface LicitationDetailClientProps {
  licitationId: number;
  initialLicitation: any;
  initialQuotation: any;
  initialAdjudications: any[];
}

export function LicitationDetailClient({
  licitationId,
  initialLicitation,
  initialQuotation,
  initialAdjudications
}: LicitationDetailClientProps) {
  const [licitation, setLicitation] = useState(initialLicitation);
  const [quotation, setQuotation] = useState(initialQuotation);
  const [adjudications, setAdjudications] = useState(initialAdjudications);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("productos");

  // Re-implement simplified loadData if needed for refresh
  const loadData = async () => {
    // In a real app, we might want to call a server action or use router.refresh()
    // but here we keep it simple for the client actions to work
    window.location.reload();
  };

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

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
        </div>
      )}
      
      {/* Tabs */}
      <FadeIn delay={200}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="productos">Productos Solicitados</TabsTrigger>
            <TabsTrigger value="cotizaciones">Cotización</TabsTrigger>
            <TabsTrigger value="entregas">Entrega de Productos</TabsTrigger>
          </TabsList>

          {/* Tab: Productos Solicitados */}
          <TabsContent value="productos" className="space-y-4">
            <RequestedProductsTab licitationProducts={licitation.licitationProducts} />
          </TabsContent>

          {/* Tab: Cotización */}
          <TabsContent value="cotizaciones" className="space-y-4">
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
          <TabsContent value="entregas" className="space-y-4">
            <DeliveryTab 
              licitationId={licitationId}
              licitationStatus={licitation.status as LicitationStatus} 
            />
          </TabsContent>
        </Tabs>
      </FadeIn>

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
