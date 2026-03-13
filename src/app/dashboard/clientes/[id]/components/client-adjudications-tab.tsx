"use client";

import { CheckCircle2, Calendar, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Adjudication } from "@/services/adjudicaciones.service";
import { AdjudicationStatus } from "@/types";
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

interface ClientAdjudicationsTabProps {
  adjudications: Adjudication[];
}

export function ClientAdjudicationsTab({ adjudications }: ClientAdjudicationsTabProps) {
  const router = useRouter();

  const getStatusInfo = (status: AdjudicationStatus) => {
    switch (status) {
      case AdjudicationStatus.TOTAL:
        return { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Total" };
      case AdjudicationStatus.PARTIAL:
        return { icon: AlertCircle, color: "text-orange-600", bgColor: "bg-orange-100", label: "Parcial" };
      default:
        return { icon: CheckCircle2, color: "text-gray-600", bgColor: "bg-gray-100", label: status };
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return "-";
    
    return new Intl.NumberFormat('es-UY', { 
      style: 'currency', 
      currency: 'UYU',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericAmount);
  };

  return (
    <Card className="border shadow-sm bg-card overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-xl">Historial de Adjudicaciones</CardTitle>
        <CardDescription>
          Adjudicaciones ganadas por este cliente
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="rounded-md border overflow-hidden bg-background">
          {adjudications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
              <p>No hay adjudicaciones registradas para este cliente.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjudications.map((adj) => {
                  const statusInfo = getStatusInfo(adj.status);
                  return (
                    <TableRow 
                      key={adj.id} 
                      className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      onClick={() => router.push(`/dashboard/licitaciones/${adj.licitationId}?tab=adjudicaciones`)}
                      role="link"
                      aria-label={`Ver adjudicación ${adj.id}`}
                    >
                      <TableCell className="font-medium text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                          #{adj.identifier || adj.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                          {adj.adjudicationDate ? format(new Date(adj.adjudicationDate), "dd/MM/yyyy", { locale: es }) : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none font-medium`}>
                          <statusInfo.icon className="mr-1 h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-green-700">
                        {adj.totalPriceWithIVA ? formatCurrency(adj.totalPriceWithIVA) : "-"}
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
