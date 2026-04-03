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
        <div className={`flex items-center justify-between p-4 rounded-xl border ${
          isLowStock ? 'bg-amber-50 border-amber-200' : 'bg-secondary/10 border-transparent'
        }`}>
          <div className="flex flex-col">
            <span className={`text-xs uppercase font-bold tracking-wider ${
              isLowStock ? 'text-amber-700' : 'text-muted-foreground'
            }`}>
              Stock Disponible
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-3xl font-black ${
                isLowStock ? 'text-amber-700' : 'text-foreground'
              }`}>
                {stock}
              </span>
              <span className="text-sm text-muted-foreground font-medium">unidades</span>
            </div>
          </div>
          {isLowStock && (
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
