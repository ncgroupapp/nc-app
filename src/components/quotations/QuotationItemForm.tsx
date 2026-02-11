"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OfferSearchCombobox } from "./OfferSearchCombobox";
import { Currency } from "@/types";
import { Offer } from "@/services/offers.service";

export type QuotationItemFormData = {
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
};

type QuotationItemFormProps = {
  data: QuotationItemFormData;
  onChange: (data: QuotationItemFormData) => void;
  productId?: number;
  showOfferSearch?: boolean;
};

export function QuotationItemForm({
  data,
  onChange,
  productId,
  showOfferSearch = true,
}: QuotationItemFormProps) {
  const handleSelectOffer = (offer: Offer) => {
    onChange({
      ...data,
      productName: offer.product?.name || offer.name || data.productName,
      brand: offer.product?.brand || data.brand,
      origin: offer.product?.origin || data.origin,
      priceWithoutIVA: offer.price,
      quantity: offer.quantity,
      deliveryTime: 0,
    });
  };

  const handleChange = <K extends keyof QuotationItemFormData>(
    field: K,
    value: QuotationItemFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Offer Search */}
      {showOfferSearch && (
        <div className="space-y-2">
          <Label>Buscar Oferta Disponible</Label>
          <OfferSearchCombobox
            productId={productId}
            onSelectOffer={handleSelectOffer}
            placeholder="Seleccionar oferta para autocompletar..."
          />
          <p className="text-xs text-muted-foreground">
            Seleccione una oferta para autocompletar los datos del producto
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Nombre del Producto</Label>
        <Input
          value={data.productName}
          onChange={(e) => handleChange("productName", e.target.value)}
          placeholder="Nombre del producto"
        />
      </div>

      {/* Marca y Origen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Marca</Label>
          <Input
            value={data.brand}
            onChange={(e) => handleChange("brand", e.target.value)}
            placeholder="Marca"
          />
        </div>
        <div className="space-y-2">
          <Label>Origen</Label>
          <Input
            value={data.origin}
            onChange={(e) => handleChange("origin", e.target.value)}
            placeholder="Origen"
          />
        </div>
      </div>

      {/* Quantity and Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cantidad</Label>
          <Input
            type="number"
            min="1"
            value={data.quantity}
            onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label>Precio sin IVA</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={data.priceWithoutIVA}
            onChange={(e) => handleChange("priceWithoutIVA", parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* IVA and Delivery */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>% IVA</Label>
          <Input
            type="number"
            value={data.ivaPercentage}
            onChange={(e) => handleChange("ivaPercentage", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label>Plazo Entrega (días)</Label>
          <Input
            type="number"
            min="0"
            value={data.deliveryTime}
            onChange={(e) => handleChange("deliveryTime", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <Label>Moneda</Label>
        <Select
          value={data.currency}
          onValueChange={(value) => handleChange("currency", value as Currency)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Currency).map((currency) => (
              <SelectItem key={currency} value={currency}>
                {currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
