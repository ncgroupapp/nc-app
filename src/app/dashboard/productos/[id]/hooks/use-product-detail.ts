"use client";

import { useState, useEffect, useCallback } from "react";
import { productsService, Product } from "@/services/products.service";
import { cotizacionesService, Quotation } from "@/services/cotizaciones.service";
import { adjudicacionesService, ProductAdjudicationHistory } from "@/services/adjudicaciones.service";

export function useProductDetail(id: number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [quotationHistory, setQuotationHistory] = useState<Quotation[]>([]);
  const [adjudicationHistory, setAdjudicationHistory] = useState<ProductAdjudicationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [productData, quotesData, adjData] = await Promise.all([
        productsService.getById(id),
        cotizacionesService.getByProductId(id),
        adjudicacionesService.getByProductId(id)
      ]);

      setProduct(productData);
      
      // Asegurar que siempre sean arrays
      setQuotationHistory(Array.isArray(quotesData) ? quotesData : []);
      
      // Manejar posible estructura ApiResponse o Array directo
      if (Array.isArray(adjData)) {
        setAdjudicationHistory(adjData);
      } else if (adjData && typeof adjData === 'object' && 'data' in adjData && Array.isArray((adjData as any).data)) {
        setAdjudicationHistory((adjData as any).data);
      } else {
        setAdjudicationHistory([]);
      }

    } catch (err) {
      console.error("Error fetching product detail:", err);
      setError("No se pudo cargar la información del producto.");
      setQuotationHistory([]);
      setAdjudicationHistory([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    product,
    quotationHistory,
    adjudicationHistory,
    loading,
    error,
    refetch: fetchData,
  };
}
