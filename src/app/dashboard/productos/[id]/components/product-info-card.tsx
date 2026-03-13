"use client";

import { DollarSign, Tag, Info, Layers, Truck, Package } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/services/products.service";

interface ProductInfoCardProps {
  product: Product;
}

export function ProductInfoCard({ product }: ProductInfoCardProps) {
  return (
    <Card className="border shadow-sm bg-card overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-foreground">{product.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && (
                <Badge variant="outline" className="text-sm font-bold bg-muted/50 px-3 py-1 border-primary/20">
                  {product.brand} {product.model}
                </Badge>
              )}
              <Badge variant="secondary" className="text-sm font-medium">
                <Tag className="mr-1.5 h-3 w-3 opacity-70" />
                {product.code || "Sin código"}
              </Badge>
            </div>
          </div>
          {product.price && (
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-right min-w-[150px]">
              <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Precio Referencia</p>
              <p className="text-3xl font-black text-primary flex items-center justify-end">
                <DollarSign className="h-6 w-6 mr-1 opacity-50" />
                {product.price}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-2">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            Descripción
          </h3>
          <p className="text-sm leading-relaxed text-foreground/80 font-medium">
            {product.description || "No hay descripción disponible para este producto."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-y border-muted bg-muted/20 px-4 -mx-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Detalles Adicionales</h3>
            <p className="text-sm font-semibold">{product.details || "—"}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Observaciones</h3>
            <p className="text-sm font-semibold">{product.observations || "—"}</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" />
            Especificaciones Técnicas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-card border border-muted-foreground/10 hover:border-primary/20 transition-colors shadow-sm">
              <div className="flex items-center text-muted-foreground mb-2">
                <Truck className="mr-2 h-4 w-4 opacity-70" />
                <span className="text-xs font-semibold uppercase tracking-widest">Chasis</span>
              </div>
              <p className="font-medium text-sm">{product.chassis || "—"}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-muted-foreground/10 hover:border-primary/20 transition-colors shadow-sm">
              <div className="flex items-center text-muted-foreground mb-2">
                <Layers className="mr-2 h-4 w-4 opacity-70" />
                <span className="text-xs font-semibold uppercase tracking-widest">Motor</span>
              </div>
              <p className="font-medium text-sm">{product.motor || "—"}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-muted-foreground/10 hover:border-primary/20 transition-colors shadow-sm">
              <div className="flex items-center text-muted-foreground mb-2">
                <Package className="mr-2 h-4 w-4 opacity-70" />
                <span className="text-xs font-semibold uppercase tracking-widest">Equipamiento</span>
              </div>
              <p className="font-medium text-sm">{product.equipment || "—"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
