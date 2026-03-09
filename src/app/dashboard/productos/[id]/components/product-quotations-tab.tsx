"use client";

import { useState, useEffect, useMemo } from "react";
import { FileText, Calendar, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Quotation, cotizacionesService } from "@/services/cotizaciones.service";
import { QuotationStatus } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataView } from "@/components/common/data-view";
import { DataTableColumn } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/use-debounce";

interface ProductQuotationsTabProps {
  quotations: Quotation[];
  productId: number;
}

export function ProductQuotationsTab({ quotations, productId }: ProductQuotationsTabProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [data, setData] = useState<Quotation[]>(quotations.slice(0, limit));
  const [total, setTotal] = useState(quotations.length);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Si no hay búsqueda y estamos en la primera página, usar los props iniciales
      if (!debouncedSearchTerm && page === 1) {
        setData(quotations.slice(0, limit));
        setTotal(quotations.length);
        return;
      }

      setIsLoading(true);
      try {
        const response = await cotizacionesService.getPaginatedByProductId(productId, {
          search: debouncedSearchTerm,
          page,
          limit,
        });
        
        setData(response.data || []);
        setTotal(response.meta?.total || 0);
      } catch (error) {
        console.error("Error fetching quotations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearchTerm, page, limit, productId, quotations]);

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

  const totalPages = Math.ceil(total / limit) || 1;

  const columns: DataTableColumn<Quotation>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (quote) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Calendar className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            {quote.createdAt ? format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: es }) : "-"}
          </div>
          {quote.validity && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Vence: {quote.validity}</span>
          )}
        </div>
      ),
      className: "whitespace-nowrap",
    },
    {
      key: "identificador",
      header: "Identificador",
      render: (quote) => {
        const statusInfo = getStatusInfo(quote.status);
        return (
          <div className="flex flex-col gap-1.5 items-start">
            <span className="text-sm tracking-tight">{quote.quotationIdentifier || "-"}</span>
            <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none font-medium text-[10px] h-5 px-1.5`}>
              <statusInfo.icon className="mr-1 h-2.5 w-2.5" />
              {statusInfo.label}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "proveedor",
      header: "Proveedor",
      render: (quote) => {
        const productItem = quote.items.find((i) => i.productId === productId);
        return (
          <span className="text-sm text-muted-foreground truncate max-w-[150px] inline-block">
            {productItem?.providerName || "-"}
          </span>
        );
      },
    },
    {
      key: "cantidad",
      header: "Cantidad",
      render: (quote) => {
        const productItem = quote.items.find((i) => i.productId === productId);
        return <div className="text-right font-mono text-xs">{productItem?.quantity || 0}</div>;
      },
      className: "text-right",
    },
    {
      key: "precio",
      header: "Precio",
      render: (quote) => {
        const productItem = quote.items.find((i) => i.productId === productId);
        return (
          <div className="flex flex-col items-end text-sm text-primary">
            <span className="text-[10px] text-muted-foreground font-medium">{productItem?.currency || 'USD'}</span>
            <span>${productItem?.priceWithoutIVA ? productItem.priceWithoutIVA.toLocaleString() : 0}</span>
          </div>
        );
      },
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
        <CardTitle className="text-xl">Historial de Cotizaciones</CardTitle>
        <CardDescription>
          Cotizaciones donde se ha incluido este producto
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <DataView
          data={data}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No hay cotizaciones registradas para este producto."
          onRowClick={(quote) => router.push(`/dashboard/licitaciones/${quote.licitationId}?tab=cotizaciones`)}
          search={{
            placeholder: "Buscar por identificador o proveedor...",
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
