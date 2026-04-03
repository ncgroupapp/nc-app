"use client";

import { Building, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/services/products.service";

interface ProductProvidersCardProps {
  providers: Product["providers"];
}

export function ProductProvidersCard({ providers }: ProductProvidersCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" aria-hidden="true" />
          Proveedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {providers && providers.length > 0 ? (
          <ul className="space-y-3">
            {providers.map((provider) => (
              <li 
                key={provider.id} 
                className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-muted-foreground/10 hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Building className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{provider.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{provider.country}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl border border-dashed border-muted-foreground/20">
            <Building className="h-8 w-8 mb-2 text-muted-foreground opacity-20" aria-hidden="true" />
            <p className="text-sm font-medium text-muted-foreground">No hay proveedores asignados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
