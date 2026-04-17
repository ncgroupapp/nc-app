"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { offersService, Offer, CreateOfferDto } from "@/services/offers.service";
import { OfferForm } from "@/components/ofertas/offer-form";

type CreateOfferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOfferCreated: (offer: Offer) => void;
  initialProductId?: number;
};

export function CreateOfferDialog({
  open,
  onOpenChange,
  onOfferCreated,
  initialProductId,
}: CreateOfferDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateOfferDto) => {
    try {
      setLoading(true);
      const newOffer = await offersService.create(data);
      toast.success("Oferta creada exitosamente");
      onOfferCreated(newOffer);
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating offer:", err);
      const message =
        err instanceof Error ? err.message : "Error al crear la oferta";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const seedData = initialProductId
    ? ({ productId: initialProductId } as Offer)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Oferta</DialogTitle>
          <DialogDescription>
            Complete los datos para registrar una nueva oferta de proveedor
          </DialogDescription>
        </DialogHeader>

        <OfferForm
          key={open ? "open" : "closed"}
          initialData={seedData}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
