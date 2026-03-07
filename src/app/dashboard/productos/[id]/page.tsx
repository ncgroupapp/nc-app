import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/common/fade-in";
import { productsService } from "@/services/products.service";
import { cotizacionesService } from "@/services/cotizaciones.service";
import { adjudicacionesService } from "@/services/adjudicaciones.service";

// Local imports
import { ProductHeader } from "./components/product-header";
import { ProductImageCard } from "./components/product-image-card";
import { ProductInventoryCard } from "./components/product-inventory-card";
import { ProductInfoCard } from "./components/product-info-card";
import { ProductProvidersCard } from "./components/product-providers-card";
import { ProductTabs } from "./components/product-tabs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam);

  try {
    // Parallel fetching on the server - Eliminates Waterfalls
    const [product, quotationHistory, adjData] = await Promise.all([
      productsService.getById(id),
      cotizacionesService.getByProductId(id),
      adjudicacionesService.getByProductId(id)
    ]);

    // Handle adjudication history structure
    let adjudicationHistory = [];
    if (Array.isArray(adjData)) {
      adjudicationHistory = adjData;
    } else if (adjData && typeof adjData === 'object' && 'data' in adjData && Array.isArray((adjData as any).data)) {
      adjudicationHistory = (adjData as any).data;
    }

    if (!product) {
      return <ErrorState message="No se encontró el producto solicitado." />;
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
              <ProductProvidersCard providers={product.providers || []} />
            </FadeIn>
          </div>

          {/* Right Column: Info & History Tabs */}
          <div className="lg:col-span-8 space-y-8">
            <FadeIn delay={400}>
              <ProductInfoCard product={product} />
            </FadeIn>

            <FadeIn delay={500}>
              <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <ProductTabs 
                  productId={id}
                  quotationHistory={Array.isArray(quotationHistory) ? quotationHistory : []} 
                  adjudicationHistory={adjudicationHistory} 
                />
              </Suspense>
            </FadeIn>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading product detail on server:", error);
    return <ErrorState message="Ocurrió un error al cargar los datos del producto." />;
  }
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 h-[60vh] text-center">
      <div className="bg-red-50 p-4 rounded-full mb-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <a href="/dashboard/productos">Volver al listado</a>
        </Button>
      </div>
    </div>
  );
}
