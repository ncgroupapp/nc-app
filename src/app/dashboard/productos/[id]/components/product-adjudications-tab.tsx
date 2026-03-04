"use client";

import { CheckCircle2, Calendar, ExternalLink, Building, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { ProductAdjudicationHistory } from "@/services/adjudicaciones.service";
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

interface ProductAdjudicationsTabProps {
  adjudications: ProductAdjudicationHistory[];
}

export function ProductAdjudicationsTab({ adjudications }: ProductAdjudicationsTabProps) {
  const router = useRouter();

  const getStatusInfo = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('total')) {
      return { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Total" };
    } else if (s.includes('parcial')) {
      return { icon: AlertCircle, color: "text-orange-600", bgColor: "bg-orange-100", label: "Parcial" };
    } else if (s.includes('pending') || s.includes('espera')) {
      return { icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100", label: "Pendiente" };
    }
    return { icon: CheckCircle2, color: "text-gray-600", bgColor: "bg-gray-100", label: status };
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
          Adjudicaciones ganadas por este producto
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="rounded-md border overflow-hidden bg-background">
          {adjudications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
              <p>No hay adjudicaciones registradas para este producto.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Referencias</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjudications.map((adj, index) => {
                  const statusInfo = getStatusInfo(adj.status);
                  return (
                    <TableRow 
                      key={index} 
                      className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      onClick={() => router.push(`/dashboard/licitaciones`)}
                      role="link"
                      aria-label={`Ver adjudicación de ${adj.entity}`}
                    >
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <Calendar className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                            {adj.date ? format(new Date(adj.date), "dd/MM/yyyy", { locale: es }) : "-"}
                          </div>
                          {adj.deadlineDate && (
                            <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Plazo: {format(new Date(adj.deadlineDate), "dd/MM/yyyy")}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start text-xs">
                          {adj.internalNumber && <span className="tracking-tight text-foreground">{adj.internalNumber}</span>}
                          {adj.contractId && <span className="text-[10px] text-muted-foreground">{adj.contractId}</span>}
                          {!adj.internalNumber && !adj.contractId && <span className="text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {adj.entity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none font-medium text-[10px] h-5 px-1.5`}>
                          <statusInfo.icon className="mr-1 h-2.5 w-2.5" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {adj.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm text-green-700">
                        {adj.unitPrice ? formatCurrency(adj.unitPrice) : "-"}
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
