"use client";

import { FileText, Calendar, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Quotation } from "@/services/cotizaciones.service";
import { QuotationStatus } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductQuotationsTabProps {
  quotations: Quotation[];
  productId: number;
}

export function ProductQuotationsTab({ quotations, productId }: ProductQuotationsTabProps) {
  const router = useRouter();

  const getStatusInfo = (status: QuotationStatus) => {
    switch (status) {
      case QuotationStatus.CREATED:
        return { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-100", label: "Creada" };
      case QuotationStatus.FINALIZED:
        return { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Finalizada" };
      case QuotationStatus.SENT:
        return { icon: ExternalLink, color: "text-purple-600", bgColor: "bg-purple-100", label: "Enviada" };
      case QuotationStatus.REJECTED:
        return { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100", label: "Rechazada" };
      case QuotationStatus.DRAFT:
        return { icon: FileText, color: "text-gray-600", bgColor: "bg-gray-100", label: "Borrador" };
      default:
        return { icon: Clock, color: "text-gray-600", bgColor: "bg-gray-100", label: status };
    }
  };

  return (
    <Card className="border shadow-sm bg-card overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-xl">Historial de Cotizaciones</CardTitle>
        <CardDescription>
          Cotizaciones donde se ha incluido este producto
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="rounded-md border overflow-hidden bg-background">
          {quotations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
              <p>No hay cotizaciones registradas para este producto.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quote) => {
                  const statusInfo = getStatusInfo(quote.status);
                  const productItem = quote.items.find((i) => i.productId === productId);
                  return (
                    <TableRow 
                      key={quote.id} 
                      className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      onClick={() => router.push(`/dashboard/licitaciones/${quote.licitationId}?tab=cotizaciones`)}
                      role="link"
                      aria-label={`Ver cotización ${quote.quotationIdentifier}`}
                    >
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <Calendar className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                            {quote.createdAt ? format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: es }) : "-"}
                          </div>
                          {quote.validity && (
                            <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Vence: {quote.validity}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="text-sm tracking-tight">{quote.quotationIdentifier || "-"}</span>
                          <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none font-medium text-[10px] h-5 px-1.5`}>
                            <statusInfo.icon className="mr-1 h-2.5 w-2.5" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px] inline-block">
                          {productItem?.providerName || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {productItem?.quantity || 0}
                      </TableCell>
                      <TableCell className="text-right text-sm text-primary">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-muted-foreground font-medium">{productItem?.currency || 'USD'}</span>
                          <span>${productItem?.priceWithoutIVA ? productItem.priceWithoutIVA.toLocaleString() : 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
