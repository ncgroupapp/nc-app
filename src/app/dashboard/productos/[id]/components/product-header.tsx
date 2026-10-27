"use client";

import { ArrowLeft, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Product } from "@/services/products.service";

interface ProductHeaderProps {
  product: Product;
}

export function ProductHeader({ product }: ProductHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          aria-label="Volver"
          className="h-9 w-9 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy">{product.name}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">Código</span>
            <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-sm font-semibold text-brand-navy">
              {product.code || "Sin código"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
