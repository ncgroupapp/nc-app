"use client";

import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/common/fade-in";

// Local imports
import { useProductDetail } from "./hooks";
import {
  ProductHeader,
  ProductImageCard,
  ProductInventoryCard,
  ProductInfoCard,
  ProductProvidersCard,
  ProductQuotationsTab,
  ProductAdjudicationsTab,
} from "./components";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = parseInt(idParam as string);

  const {
    product,
    quotationHistory,
    adjudicationHistory,
    loading,
    error,
  } = useProductDetail(id);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[60vh] text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {error || "No pudimos encontrar el producto que estás buscando. Puede que haya sido eliminado o el ID sea incorrecto."}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Volver
          </Button>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <FadeIn direction="none">
        <ProductHeader product={product} />
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image, Inventory & Providers */}
        <div className="lg:col-span-4 space-y-6">
          <FadeIn delay={100}>
            <ProductImageCard product={product} />
          </FadeIn>

          <FadeIn delay={200}>
            <ProductInventoryCard product={product} />
          </FadeIn>

          <FadeIn delay={300}>
            <ProductProvidersCard providers={product.providers} />
          </FadeIn>
        </div>

        {/* Right Column: Info & History Tabs */}
        <div className="lg:col-span-8 space-y-8">
          <FadeIn delay={400}>
            <ProductInfoCard product={product} />
          </FadeIn>

          <FadeIn delay={500}>
            <Tabs defaultValue="quotations" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1 h-auto mb-6 border">
                <TabsTrigger 
                  value="quotations" 
                  className="data-[state=active]:bg-background py-2 transition-all font-bold"
                >
                  Cotizaciones ({quotationHistory.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="adjudications"
                  className="data-[state=active]:bg-background py-2 transition-all font-bold"
                >
                  Adjudicaciones ({adjudicationHistory.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="quotations" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <ProductQuotationsTab quotations={quotationHistory} productId={id} />
              </TabsContent>

              <TabsContent value="adjudications" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <ProductAdjudicationsTab adjudications={adjudicationHistory} />
              </TabsContent>
            </Tabs>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[120px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-8 space-y-8">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
