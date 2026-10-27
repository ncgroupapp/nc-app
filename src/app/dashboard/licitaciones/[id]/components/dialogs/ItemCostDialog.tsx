"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { OfferSearchCombobox } from "@/components/quotations/OfferSearchCombobox";
import { cotizacionesService, QuotationItem } from "@/services/cotizaciones.service";
import { Offer } from "@/services/offers.service";
import { handleActionError } from "@/lib/error-handler";

interface ItemCostDialogProps {
  quotationId: number;
  item: QuotationItem | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (item: QuotationItem) => void;
}

const formatAmount = (value: number) =>
  value.toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Picks the supplier offer that defines an item's cost. Works on finalized quotations: prices and PDF don't change. */
export const ItemCostDialog = ({ quotationId, item, onOpenChange, onSaved }: ItemCostDialogProps) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOffer(null);
  }, [item]);

  const save = async (offerId: number | null) => {
    if (!item?.id) return;
    setSaving(true);
    try {
      const updated = await cotizacionesService.setItemOffer(quotationId, item.id, offerId);
      onSaved({ ...item, offerId: updated.offerId, unitCost: updated.unitCost, costCurrency: updated.costCurrency });
      onOpenChange(false);
    } catch (error) {
      handleActionError(error, "No se pudo guardar la oferta");
    } finally {
      setSaving(false);
    }
  };

  const hasCost = item?.unitCost !== null && item?.unitCost !== undefined;

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Oferta del proveedor (costo)</DialogTitle>
          <DialogDescription>
            {item?.productName}. La oferta elegida define el costo para Rentabilidad; el precio de venta y el PDF no cambian.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Costo actual: </span>
            {hasCost ? (
              <b>{item?.costCurrency} {formatAmount(Number(item?.unitCost))}</b>
            ) : (
              <span className="font-medium text-amber-700">sin oferta elegida</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Elegir oferta</Label>
            <OfferSearchCombobox
              productId={item?.productId}
              onSelectOffer={setOffer}
              placeholder="Buscar oferta del proveedor..."
            />
            {offer && (
              <p className="text-sm">
                Nuevo costo: <b>{offer.currency ?? "USD"} {formatAmount(Number(offer.price))}</b>
                {" · "}{offer.provider?.name || offer.providerName || "Proveedor"}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {hasCost ? (
            <Button variant="ghost" className="text-red-600" onClick={() => save(null)} disabled={saving}>
              Quitar oferta
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => offer && save(offer.id)} disabled={!offer || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
