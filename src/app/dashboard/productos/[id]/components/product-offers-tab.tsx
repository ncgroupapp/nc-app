"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Offer, offersService } from "@/services/offers.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataView } from "@/components/common/data-view";
import { DataTableColumn } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/use-debounce";

interface ProductOffersTabProps {
  offers: Offer[];
  productId: number;
}

export function ProductOffersTab({ offers, productId }: ProductOffersTabProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [data, setData] = useState<Offer[]>(offers.slice(0, limit));
  const [total, setTotal] = useState(offers.length);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!debouncedSearchTerm && page === 1) {
        setData(offers.slice(0, limit));
        setTotal(offers.length);
        return;
      }

      setIsLoading(true);
      try {
        const response = await offersService.getAll({
          productId,
          search: debouncedSearchTerm,
          page,
          limit,
        });
        
        setData(response.data || []);
        setTotal(response.meta?.total || 0);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearchTerm, page, limit, productId, offers]);

  const totalPages = Math.ceil(total / limit) || 1;

  const columns: DataTableColumn<Offer>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (offer) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Calendar className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            {offer.createdAt ? format(new Date(offer.createdAt), "dd/MM/yyyy", { locale: es }) : "-"}
          </div>
        </div>
      ),
      className: "whitespace-nowrap",
    },
    {
      key: "proveedor",
      header: "Proveedor",
      render: (offer) => (
        <span className="text-sm font-medium text-foreground truncate max-w-[150px] inline-block">
          {offer.providerName || (offer.provider ? offer.provider.name : "-")}
        </span>
      ),
    },
    {
      key: "origen",
      header: "Origen",
      render: (offer) => (
        <span className="text-sm text-muted-foreground truncate max-w-[150px] inline-block">
          {offer.origin || "-"}
        </span>
      ),
    },
    {
      key: "cantidad",
      header: "Cantidad",
      render: (offer) => (
        <div className="text-right font-mono text-xs">{offer.quantity || 0}</div>
      ),
      className: "text-right",
    },
    {
      key: "precio",
      header: "Precio Unitario",
      render: (offer) => (
        <div className="text-right text-sm text-primary font-medium">
          ${offer.price ? offer.price.toLocaleString() : 0}
        </div>
      ),
      className: "text-right",
    },
    {
      key: "entrega",
      header: "Fecha Entrega",
      render: (offer) => (
        <div className="flex justify-end text-xs text-muted-foreground whitespace-nowrap">
          {offer.deliveryDate ? format(new Date(offer.deliveryDate), "dd/MM/yyyy", { locale: es }) : "-"}
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <Card className="border shadow-sm bg-card overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-xl">Historial de Ofertas</CardTitle>
        <CardDescription>
          Ofertas directas de proveedores recibidas para este producto
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <DataView
          data={data}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No hay ofertas registradas que coincidan con los filtros."
          search={{
            placeholder: "Buscar por proveedor u origen...",
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
