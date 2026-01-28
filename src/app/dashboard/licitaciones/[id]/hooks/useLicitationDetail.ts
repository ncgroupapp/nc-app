"use client";

import { useState, useEffect, useCallback } from "react";
import { licitacionesService, Licitation } from "@/services/licitaciones.service";
import { cotizacionesService, Quotation } from "@/services/cotizaciones.service";
import { adjudicacionesService, Adjudication } from "@/services/adjudicaciones.service";

export interface UseLicitationDetailReturn {
  licitation: Licitation | null;
  quotation: Quotation | null;
  adjudications: Adjudication[];
  loading: boolean;
  error: string | null;
  setQuotation: React.Dispatch<React.SetStateAction<Quotation | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  loadData: () => Promise<void>;
}

export const useLicitationDetail = (licitationId: number): UseLicitationDetailReturn => {
  const [licitation, setLicitation] = useState<Licitation | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [adjudications, setAdjudications] = useState<Adjudication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load licitation
      const licitationData = await licitacionesService.getById(licitationId);
      setLicitation(licitationData);
      
      // Try to load existing quotation for this licitation
      try {
        const quotationsRes = await cotizacionesService.getAll({ page: 1, limit: 100 });
        const existingQuotation = quotationsRes.data?.find(q => q.licitationId === licitationId);
        if (existingQuotation) {
          setQuotation(existingQuotation);
        }
      } catch {
        // No quotation yet, that's ok
      }
      
      // Load adjudications
      try {
        const adjudicationsData = await adjudicacionesService.getByLicitation(licitationId);
        // Handle both array and paginated response formats
        if (Array.isArray(adjudicationsData)) {
          setAdjudications(adjudicationsData);
        } else if (adjudicationsData && typeof adjudicationsData === 'object' && 'data' in adjudicationsData) {
          setAdjudications((adjudicationsData as { data: Adjudication[] }).data || []);
        } else {
          setAdjudications([]);
        }
      } catch {
        // No adjudications yet
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar la licitación');
    } finally {
      setLoading(false);
    }
  }, [licitationId]);

  useEffect(() => {
    if (licitationId) {
      loadData();
    }
  }, [licitationId, loadData]);

  return {
    licitation,
    quotation,
    adjudications,
    loading,
    error,
    setQuotation,
    setError,
    loadData
  };
};
