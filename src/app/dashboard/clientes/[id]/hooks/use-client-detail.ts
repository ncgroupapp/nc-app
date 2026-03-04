"use client";

import { useState, useEffect, useCallback } from "react";
import { Cliente } from "@/types";
import { clientesService } from "@/services/clientes.service";
import { cotizacionesService, Quotation } from "@/services/cotizaciones.service";
import { adjudicacionesService, Adjudication } from "@/services/adjudicaciones.service";

export function useClientDetail(id: string) {
  const [client, setClient] = useState<Cliente | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [adjudications, setAdjudications] = useState<Adjudication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [clientData, quotationsData, adjudicationsData] = await Promise.all([
        clientesService.getById(id),
        cotizacionesService.getByClientId(id),
        adjudicacionesService.getByClientId(id)
      ]);

      if (clientData.success) {
        setClient(clientData.data);
      } else {
        setError(clientData.message || "Error al cargar el cliente");
      }

      setQuotations(Array.isArray(quotationsData) ? quotationsData : []);
      setAdjudications(Array.isArray(adjudicationsData) ? adjudicationsData : []);
    } catch (err) {
      console.error("Error fetching client detail:", err);
      setError("Ocurrió un error al cargar los datos del cliente");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    client,
    quotations,
    adjudications,
    loading,
    error,
    refetch: fetchData,
    setError
  };
}
