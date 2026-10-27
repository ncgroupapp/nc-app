"use client";

import { AlertTriangle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/services/products.service";

interface ProductInventoryCardProps {
  product: Product;
}

export function ProductInventoryCard({ product }: ProductInventoryCardProps) {
  const stock = product.stockQuantity ?? 0;
  const isLowStock = stock <= 5;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" aria-hidden="true" />
          Inventario
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-brand-navy to-[#28407A] p-5 text-white">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-cyan">
              Stock disponible
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">{stock}</span>
              <span className="text-sm font-medium text-slate-300">unidades</span>
            </div>
          </div>
          {isLowStock && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {stock === 0 ? "Agotado" : "Bajo stock"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
