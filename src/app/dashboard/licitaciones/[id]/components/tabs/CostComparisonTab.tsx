"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Package, Scale, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CostComparisonOffer, CostComparisonProduct, licitacionesService } from "@/services/licitaciones.service";

interface CostComparisonTabProps {
  licitationId: number;
  /** Purchase number, used as the CD name of offers loaded from here. */
  callNumber: string;
}

/** Offers page link that opens "Nueva Oferta" with the CD, product and quantity already filled in. */
const newOfferHref = (callNumber: string, product: CostComparisonProduct) =>
  `/dashboard/ofertas?${new URLSearchParams({
    nuevaOferta: "1",
    cd: callNumber,
    productId: String(product.productId),
    producto: product.name,
    cantidad: String(product.quantity),
  })}`;

const formatMoney = (currency: string, value: number) =>
  `${currency} ${value.toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const priceWithIva = (offer: CostComparisonOffer) => offer.price * (1 + offer.iva / 100);

/** Adds up the cheapest total of every product, per currency (offers may be in UYU or USD). */
function bestTotalsByCurrency(products: CostComparisonProduct[]) {
  const totals = new Map<string, number>();
  for (const product of products) {
    const best = product.offers[0];
    if (!best) continue;
    totals.set(best.currency, (totals.get(best.currency) ?? 0) + priceWithIva(best) * product.quantity);
  }
  return [...totals.entries()];
}

export function CostComparisonTab({ licitationId, callNumber }: CostComparisonTabProps) {
  const [products, setProducts] = useState<CostComparisonProduct[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    licitacionesService
      .getCostComparison(licitationId)
      .then((data) => !cancelled && setProducts(data))
      .catch((err) => {
        console.error("Error loading cost comparison:", err);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [licitationId]);

  if (error) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No se pudo cargar la comparativa de costos. Recargá la página para intentar de nuevo.
        </CardContent>
      </Card>
    );
  }

  if (!products) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  const withOffers = products.filter((p) => p.offers.length > 0).length;
  const bestTotals = bestTotalsByCurrency(products);

  return (
    <Card className="border shadow-sm bg-card overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span>Comparativa de costos</span>
          <Badge variant="secondary" className="font-bold ml-2">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </Badge>
        </CardTitle>
        <CardDescription>Ofertas de cada proveedor por producto, ordenadas de menor a mayor precio</CardDescription>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
          <Stat label="Productos" value={String(products.length)} />
          <Stat label="Con ofertas" value={String(withOffers)} />
          <Stat label="Sin ofertas" value={String(products.length - withOffers)} danger={products.length > withOffers} />
          <Stat
            label="Total con mejor precio (c/IVA)"
            value={bestTotals.length ? bestTotals.map(([currency, total]) => formatMoney(currency, total)).join(" + ") : "-"}
          />
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 space-y-4">
        {products.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Esta licitación todavía no tiene productos solicitados.</p>
        )}

        {products.map((product) => {
          const subtitle = `${product.code ? `${product.code} · ` : ""}Cantidad: ${product.quantity}`;

          if (product.offers.length === 0) {
            return (
              <div key={product.productId} className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50/60 px-4 py-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{subtitle} · Sin ofertas: falta pedir precio</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href={newOfferHref(callNumber, product)}>Cargar oferta</Link>
                </Button>
              </div>
            );
          }

          const best = priceWithIva(product.offers[0]);
          return (
            <div key={product.productId} className="overflow-hidden rounded-lg border">
              <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2.5">
                <Package className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/productos/${product.productId}`} className="block truncate text-sm font-semibold hover:underline">
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
                <Badge variant="secondary">
                  {product.offers.length} {product.offers.length === 1 ? "oferta" : "ofertas"}
                </Badge>
                <Button size="sm" variant="outline" asChild>
                  <Link href={newOfferHref(callNumber, product)}>Cargar oferta</Link>
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead className="text-right">Precio unit. s/IVA</TableHead>
                      <TableHead className="text-right">Precio unit. c/IVA</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Plazo de entrega</TableHead>
                      <TableHead>Origen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.offers.map((offer, index) => {
                      const unit = priceWithIva(offer);
                      // Price gaps only make sense against an offer in the same currency
                      const diff = offer.currency === product.offers[0].currency ? Math.round(((unit - best) / best) * 100) : 0;
                      return (
                        <TableRow key={offer.offerId} className={cn(index === 0 && "bg-emerald-50/70 hover:bg-emerald-50")}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {offer.providerName}
                              {index === 0 && product.offers.length > 1 && (
                                <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                  <Trophy className="h-3 w-3" aria-hidden="true" />
                                  Mejor precio
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{offer.brand || <span className="text-muted-foreground">-</span>}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatMoney(offer.currency, offer.price)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(offer.currency, unit)}
                            {diff > 0 && <span className="ml-1.5 text-xs text-red-600">+{diff}%</span>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {formatMoney(offer.currency, unit * product.quantity)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-xs font-medium",
                                offer.delivery > 7 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700",
                              )}
                            >
                              {offer.delivery === 1 ? "1 día" : `${offer.delivery} días`}
                            </span>
                          </TableCell>
                          <TableCell>{offer.origin || <span className="text-muted-foreground">-</span>}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold", danger && "text-red-600")}>{value}</p>
    </div>
  );
}
