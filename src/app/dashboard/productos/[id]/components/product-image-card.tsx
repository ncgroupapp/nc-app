"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Product } from "@/services/products.service";

interface ProductImageCardProps {
  product: Product;
}

export function ProductImageCard({ product }: ProductImageCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = product?.images && product.images.length > 0 
    ? product.images 
    : (product?.image ? [product.image] : []);

  if (images.length === 0) {
    return (
      <Card className="aspect-square relative bg-secondary/20 flex items-center justify-center p-4 border shadow-sm">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Package className="h-16 w-16 opacity-20" />
          <span className="text-sm font-medium">Sin imagen</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border shadow-sm flex flex-col gap-0 py-0">
      <div className="aspect-square relative bg-[radial-gradient(circle_at_50%_40%,#fff_0,#F4F7FB_75%)] flex items-center justify-center p-6">
        <div className="relative w-full h-full group flex items-center justify-center">
          <img
            src={images[currentImageIndex]}
            alt={product.name}
            className="max-h-[88%] max-w-[88%] object-contain mix-blend-multiply transition-all"
          />
          {images.length > 1 && (
            <span className="absolute left-0 bottom-0 rounded-full border bg-white px-2.5 py-0.5 text-xs font-semibold text-brand-navy shadow-sm">
              {currentImageIndex + 1} / {images.length}
            </span>
          )}
          {images.length > 1 && (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm h-8 w-8" 
                onClick={() => setCurrentImageIndex((p) => (p === 0 ? images.length - 1 : p - 1))}
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm h-8 w-8" 
                onClick={() => setCurrentImageIndex((p) => (p + 1) % images.length)}
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2.5 p-3 overflow-x-auto bg-white border-t scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`relative flex-shrink-0 grid place-items-center size-16 rounded-xl overflow-hidden border-2 bg-[radial-gradient(circle_at_50%_40%,#fff_0,#F1F5FA_70%)] transition-all ${
                idx === currentImageIndex ? 'border-brand-blue ring-2 ring-brand-blue/20' : 'border-border hover:border-brand-blue/40'
              }`}
              aria-label={`Ver miniatura ${idx + 1}`}
            >
              <img src={img} alt={`Miniatura ${idx + 1}`} className="max-w-[86%] max-h-[86%] object-contain mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
