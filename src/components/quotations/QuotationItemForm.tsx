"use client";

import { useEffect, useState } from "react";
import { TrendingUp, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OfferSearchCombobox } from "./OfferSearchCombobox";
import { Currency } from "@/types/enums";
import { Offer } from "@/services/offers.service";
import { rentabilidadService, toUsd } from "@/services/rentabilidad.service";

export type QuotationItemFormData = {
  productId: string;
  productName: string;
  brand: string;
  origin: string;
  quantity: number | "";
  priceWithoutIVA: number | "";
  ivaPercentage: number | "";
  deliveryTime: number | "";
  inStock: boolean;
  currency: Currency;
  /** Supplier offer chosen for the item: it defines the cost, the sale price is entered apart. */
  providerId: number | null;
  providerName: string;
  offerId: number | null;
  unitCost: number | null;
  costCurrency: Currency | null;
};

type QuotationItemFormProps = {
  data: QuotationItemFormData;
  onChange: (data: QuotationItemFormData) => void;
  productId?: number;
  showOfferSearch?: boolean;
};

const formatAmount = (value: number) =>
  value.toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function QuotationItemForm({
  data,
  onChange,
  productId,
  showOfferSearch = true,
}: QuotationItemFormProps) {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    rentabilidadService
      .getSettings()
      .then((settings) => setExchangeRate(settings.exchangeRate))
      .catch(() => setExchangeRate(null));
  }, []);

  const handleSelectOffer = (offer: Offer) => {
    // The offer price is the COST of the item; the sale price is not overwritten.
    onChange({
      ...data,
      productName: offer.product?.name || offer.name || data.productName,
      brand: offer.product?.brand || data.brand,
      origin: offer.origin ?? offer.product?.origin ?? data.origin,
      quantity: offer.quantity,
      ivaPercentage: offer.iva ?? 0,
      deliveryTime: offer.delivery ?? 0,
      providerId: offer.providerId ?? null,
      providerName: offer.provider?.name || offer.providerName || "",
      offerId: offer.id,
      unitCost: Number(offer.price),
      costCurrency: offer.currency ?? Currency.USD,
    });
  };

  const clearOffer = () => {
    onChange({ ...data, offerId: null, unitCost: null, costCurrency: null });
  };

  const handleChange = <K extends keyof QuotationItemFormData>(
    field: K,
    value: QuotationItemFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const hasOffer = data.unitCost !== null;
  const saleUsd = data.priceWithoutIVA === "" ? null : toUsd(Number(data.priceWithoutIVA), data.currency, exchangeRate);
  const costUsd = hasOffer ? toUsd(Number(data.unitCost), data.costCurrency, exchangeRate) : null;
  const profitUsd = saleUsd !== null && costUsd !== null ? saleUsd - costUsd : null;
  const margin = profitUsd !== null && saleUsd ? (profitUsd / saleUsd) * 100 : null;

  return (
    <div className="space-y-4">
      {/* Offer Search */}
      {showOfferSearch && (
        <div className="space-y-2">
          <Label>Buscar Oferta Disponible</Label>
          <OfferSearchCombobox
            productId={productId}
            onSelectOffer={handleSelectOffer}
            placeholder="Seleccionar oferta del proveedor..."
          />
          <p className="text-xs text-blue-950">
            La oferta elegida define el costo del ítem; el precio de venta se carga aparte
          </p>
        </div>
      )}

      {/* Chosen offer = cost */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold tracking-wider text-blue-700">OFERTA DEL PROVEEDOR (COSTO)</p>
          {hasOffer && (
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearOffer}>
              <X className="mr-1 h-3 w-3" aria-hidden="true" />
              Quitar oferta
            </Button>
          )}
        </div>
        {hasOffer ? (
          <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Oferta elegida</p>
              <p className="font-medium">{data.providerName || "Proveedor sin nombre"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Costo unitario</p>
              <p className="font-medium">{data.costCurrency} {formatAmount(Number(data.unitCost))}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Entrega · Origen</p>
              <p className="font-medium">
                {data.deliveryTime === "" ? "—" : `${data.deliveryTime} días`} · {data.origin || "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Sin oferta: este ítem no cuenta para la rentabilidad hasta que elijas una.
          </p>
        )}
      </div>

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
            onChange={(e) => handleChange("quantity", e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Precio de venta unitario (sin IVA)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={data.priceWithoutIVA}
            onChange={(e) => handleChange("priceWithoutIVA", e.target.value === "" ? "" : Number(e.target.value))}
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
            onChange={(e) => handleChange("ivaPercentage", e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Plazo Entrega (días)</Label>
          <Input
            type="number"
            min="0"
            value={data.deliveryTime}
            onChange={(e) => handleChange("deliveryTime", e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <Label>Moneda de venta</Label>
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

      {/* Margin preview */}
      {hasOffer && (
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            margin === null ? "bg-muted text-muted-foreground" : margin < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" />
          {margin === null ? (
            <span>
              {exchangeRate
                ? "No se puede calcular el margen: solo se convierten USD y UYU."
                : "Cargá el tipo de cambio en Rentabilidad para ver el margen."}
            </span>
          ) : (
            <span>
              {exchangeRate ? `Con tipo de cambio ${formatAmount(exchangeRate)}: ` : ""}venta{" "}
              <b>USD {formatAmount(saleUsd!)}</b> · ganancia <b>USD {formatAmount(profitUsd!)}</b> por unidad · margen{" "}
              <b>{margin.toLocaleString("es-UY", { maximumFractionDigits: 1 })} %</b>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
