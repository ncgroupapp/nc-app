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
    <Card className="overflow-hidden border shadow-sm flex flex-col">
      <div className="aspect-square relative bg-secondary/10 flex items-center justify-center p-4">
        <div className="relative w-full h-full group flex items-center justify-center">
          <img 
            src={images[currentImageIndex]} 
            alt={product.name} 
            className="max-h-full max-w-full object-contain transition-all" 
          />
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
        <div className="flex gap-2 p-3 overflow-x-auto bg-muted/30 border-t scrollbar-hide">
          {images.map((img, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentImageIndex(idx)} 
              className={`relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                idx === currentImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'
              }`}
              aria-label={`Ver miniatura ${idx + 1}`}
            >
              <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
