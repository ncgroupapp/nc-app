"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle2, Calendar, ExternalLink, Building, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { ProductAdjudicationHistory, adjudicacionesService } from "@/services/adjudicaciones.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataView } from "@/components/common/data-view";
import { DataTableColumn } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/use-debounce";

interface ProductAdjudicationsTabProps {
  adjudications: ProductAdjudicationHistory[];
  productId: number;
}

export function ProductAdjudicationsTab({ adjudications, productId }: ProductAdjudicationsTabProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [data, setData] = useState<ProductAdjudicationHistory[]>(adjudications.slice(0, limit));
  const [total, setTotal] = useState(adjudications.length);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!debouncedSearchTerm && page === 1) {
        setData(adjudications.slice(0, limit));
        setTotal(adjudications.length);
        return;
      }

      setIsLoading(true);
      try {
        const response = await adjudicacionesService.getPaginatedByProductId(productId, {
          search: debouncedSearchTerm,
          page,
          limit,
        });
        
        // Map Adjudication to ProductAdjudicationHistory format
        const mappedData = (response.data || []).map(adj => {
          const item = adj.items?.find((i: any) => i.productId === productId);
          return {
            date: adj.adjudicationDate || adj.createdAt,
            entity: adj.licitation?.client?.name || (adj as any).clientName || 'Cliente desconocido',
            status: adj.status,
            quantity: item?.quantity || adj.totalQuantity || 0,
            unitPrice: item?.unitPrice || 0,
            contractId: adj.identifier || `#${adj.id}`,
            deadlineDate: (adj as any).deadlineDate,
            internalNumber: adj.licitation?.internalNumber || (adj.licitation as any)?.callNumber
          };
        });

        setData(mappedData);
        setTotal(response.meta?.total || 0);
      } catch (error) {
        console.error("Error fetching adjudications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearchTerm, page, limit, productId, adjudications]);

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

  const totalPages = Math.ceil(total / limit) || 1;

  const columns: DataTableColumn<ProductAdjudicationHistory>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (adj) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Calendar className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            {adj.date ? format(new Date(adj.date), "dd/MM/yyyy", { locale: es }) : "-"}
          </div>
          {adj.deadlineDate && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Plazo: {format(new Date(adj.deadlineDate), "dd/MM/yyyy")}</span>
          )}
        </div>
      ),
      className: "whitespace-nowrap",
    },
    {
      key: "referencias",
      header: "Referencias",
      render: (adj) => (
        <div className="flex flex-col gap-1 items-start text-xs">
          {adj.internalNumber && <span className="tracking-tight text-foreground">{adj.internalNumber}</span>}
          {adj.contractId && <span className="text-[10px] text-muted-foreground">{adj.contractId}</span>}
          {!adj.internalNumber && !adj.contractId && <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: "cliente",
      header: "Cliente",
      render: (adj) => (
        <div className="flex items-center gap-1.5">
          <Building className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {adj.entity}
          </span>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (adj) => {
        const statusInfo = getStatusInfo(adj.status);
        return (
          <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none font-medium text-[10px] h-5 px-1.5`}>
            <statusInfo.icon className="mr-1 h-2.5 w-2.5" />
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      key: "cantidad",
      header: "Cantidad",
      render: (adj) => (
        <div className="text-right font-mono text-xs">{adj.quantity}</div>
      ),
      className: "text-right",
    },
    {
      key: "precio",
      header: "Precio Unit.",
      render: (adj) => (
        <div className="text-right text-sm text-green-700">
          {adj.unitPrice ? formatCurrency(adj.unitPrice) : "-"}
        </div>
      ),
      className: "text-right",
    },
    {
      key: "acciones",
      header: "",
      render: () => (
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
      ),
      className: "w-[50px]",
    }
  ];

  return (
    <Card className="border shadow-sm bg-card overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-xl">Historial de Adjudicaciones</CardTitle>
        <CardDescription>
          Adjudicaciones ganadas por este producto
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <DataView
          data={data}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No hay adjudicaciones registradas para este producto."
          onRowClick={() => router.push(`/dashboard/licitaciones`)}
          search={{
            placeholder: "Buscar por cliente o referencia...",
            onSearch: (q) => {
              setSearchTerm(q);
              setPage(1);
            },
            value: searchTerm,
          }}
          pagination={{
            page,
            limit,
            total: total,
            totalPages,
            onPageChange: setPage,
          }}
        />
      </CardContent>
    </Card>
  );
}
