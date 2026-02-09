import { QuotationItem } from "@/services/cotizaciones.service";

export interface QuotationTotals {
  subtotal: number;
  iva: number;
  total: number;
}

export const calcularTotales = (items: QuotationItem[] | undefined): QuotationTotals => {
  if (!items || items.length === 0) {
    return { subtotal: 0, iva: 0, total: 0 };
  }
  
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.priceWithoutIVA) * Number(item.quantity)),
    0
  );
  
  const total = items.reduce(
    (sum, item) => sum + (Number(item.priceWithIVA) * Number(item.quantity)),
    0
  );
  
  const iva = total - subtotal;
  
  return { subtotal, iva, total };
};
