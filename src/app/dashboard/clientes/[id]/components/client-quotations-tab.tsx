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

interface ClientQuotationsTabProps {
  quotations: Quotation[];
}

export function ClientQuotationsTab({ quotations }: ClientQuotationsTabProps) {
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
          Todas las cotizaciones realizadas para este cliente
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="rounded-md border overflow-hidden bg-background">
          {quotations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
              <p>No hay cotizaciones registradas para este cliente.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">Identificador</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quote) => {
                  const statusInfo = getStatusInfo(quote.status);
                  return (
                    <TableRow 
                      key={quote.id} 
                      className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      onClick={() => router.push(`/dashboard/licitaciones/${quote.licitationId}?tab=cotizaciones`)}
                      role="link"
                      aria-label={`Ver cotización ${quote.quotationIdentifier}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary opacity-70" aria-hidden="true" />
                          {quote.quotationIdentifier}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                          {quote.quotationDate ? format(new Date(quote.quotationDate), "dd/MM/yyyy", { locale: es }) : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none font-medium`}>
                          <statusInfo.icon className="mr-1 h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        {quote.items?.length || 0}
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
