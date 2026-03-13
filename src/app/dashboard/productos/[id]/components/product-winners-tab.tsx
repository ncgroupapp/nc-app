"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Building2, 
  Trophy,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTableColumn } from "@/components/ui/data-table";
import { DataView } from "@/components/common/data-view";

interface ProductWinnersTabProps {
  winners: any[];
  productId: number;
}

interface Winner {
  adjudicationDate?: string;
  date?: string;
  createdAt?: string;
  status?: string;
  licitationNumber?: string;
  callNumber?: string;
  licitationId?: string;
  contractId?: string;
  competitorName?: string;
  providerName?: string;
  winnerName?: string;
  brand?: string;
  marca?: string;
  model?: string;
  modelo?: string;
  quantity?: number;
  totalQuantity?: number;
  unitPrice?: number;
  price?: number;
  currency?: string;
  totalPrice?: number;
  competitorPrice?: number;
  competitorBrand?: string;
  competitorRut?: string;
}

export function ProductWinnersTab({ winners = [], productId }: ProductWinnersTabProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;

  const safeWinners = Array.isArray(winners) ? winners : [];

  const filteredData = useMemo(() => {
    let data = [...safeWinners];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter((item) => {
        const searchableText = [
            item.licitationNumber,
            item.callNumber,
            item.licitationId,
            item.competitorName,
            item.providerName,
            item.winnerName,
            item.brand,
            item.marca,
            item.model,
            item.modelo,
            item.contractId,
            item.competitorBrand,
            item.competitorRut
        ].filter(Boolean).join(" ").toLowerCase();
        
        return searchableText.includes(lowerSearch);
      });
    }

    return data;
  }, [safeWinners, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredData.slice(startIndex, startIndex + limit);
  }, [filteredData, page, limit]);

  const totalPages = Math.ceil(filteredData.length / limit) || 1;

  const formatCurrency = (amount: number | string, currency = 'UYU') => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return "-";
    
    return new Intl.NumberFormat('es-UY', { 
      style: 'currency', 
      currency: currency || 'UYU',
      minimumFractionDigits: 2
    }).format(numericAmount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  const columns: DataTableColumn<Winner>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (winner) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {formatDate(
              winner.adjudicationDate || winner.date || winner.createdAt || "",
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {winner.status || "Adjudicado"}
          </span>
        </div>
      ),
    },
    {
      key: "licitacion",
      header: "Licitación",
      render: (winner) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">
            {winner.licitationNumber ||
              winner.callNumber ||
              winner.licitationId ||
              "-"}
          </span>
          {winner.contractId && (
            <span className="text-xs text-muted-foreground">
              ID: {winner.contractId}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "ganador",
      header: "Ganador",
      render: (winner) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium text-sm">
            {winner.competitorName ||
              winner.providerName ||
              winner.winnerName ||
              "Desconocido"}
          </span>
        </div>
      ),
    },
    {
      key: "marca_modelo",
      header: "Marca / Modelo",
      render: (winner) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">
            {winner.competitorBrand || winner.marca || "-"}
          </span>
          <span className="text-xs text-muted-foreground">
            {winner.model || winner.modelo || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "cantidad",
      header: "Cantidad",
      render: (winner) => (
        <Badge variant="secondary" className="font-mono">
          {winner.quantity || winner.totalQuantity || 0}
        </Badge>
      ),
      className: "text-right",
    },
    {
      key: "precio_unit",
      header: "Precio Unit.",
      render: (winner) => (
        <span className="font-mono text-sm">
          {formatCurrency(
            winner.competitorPrice || winner.price || 0,
            winner.currency,
          )}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "total",
      header: "Total",
      render: (winner) => (
        <span className="font-mono font-medium text-sm">
          {formatCurrency(
            winner.totalPrice ||
              (winner.competitorPrice || winner.price || 0) *
                (winner.quantity || 0),
            winner.currency,
          )}
        </span>
      ),
      className: "text-right",
    },
  ];

  return (
    <Card className="border shadow-sm bg-card overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Historial de Ganadores
        </CardTitle>
        <CardDescription>
          Registro histórico de adjudicaciones a competidores para este producto
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <DataView
            data={paginatedData}
            columns={columns}
            emptyMessage="No se encontraron resultados en el historial de ganadores."
            search={{
                placeholder: "Buscar por licitación, ganador, marca...",
                onSearch: (q) => {
                    setSearchTerm(q);
                    setPage(1);
                },
                value: searchTerm,
            }}
            pagination={{
                page,
                limit,
                total: filteredData.length,
                totalPages,
                onPageChange: setPage,
            }}
        />
      </CardContent>
    </Card>
  );
}
