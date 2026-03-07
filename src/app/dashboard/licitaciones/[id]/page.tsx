import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/common/fade-in";
import { licitacionesService } from "@/services/licitaciones.service";
import { cotizacionesService } from "@/services/cotizaciones.service";
import { adjudicacionesService } from "@/services/adjudicaciones.service";

// Local imports
import { LicitationHeader } from "./components/LicitationHeader";
import { LicitationInfoCard } from "./components/LicitationInfoCard";
import { LicitationDetailClient } from "./components/LicitationDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LicitacionDetailPage({ params }: PageProps) {
  const { id: idParam } = await params;
  const licitationId = parseInt(idParam);

  try {
    // Parallel fetching on the server - Eliminates Waterfalls
    const [licitation, quotationsRes, adjudicationsData] = await Promise.all([
      licitacionesService.getById(licitationId),
      cotizacionesService.getAll({ page: 1, limit: 100 }), // We'll find the one for this licitation
      adjudicacionesService.getByLicitation(licitationId).catch(() => [])
    ]);

    const quotation = quotationsRes.data?.find(q => q.licitationId === licitationId) || null;
    
    // Handle adjudications data structure
    let adjudications = [];
    if (Array.isArray(adjudicationsData)) {
      adjudications = adjudicationsData;
    } else if (adjudicationsData && typeof adjudicationsData === 'object' && 'data' in adjudicationsData) {
      adjudications = (adjudicationsData as any).data || [];
    }

    if (!licitation) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">Licitación no encontrada</p>
          <Link href="/dashboard/licitaciones">
            <Button className="mt-4">Volver al listado</Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <FadeIn direction="none">
          <LicitationHeader licitation={licitation} />
        </FadeIn>

        {/* General Info Card */}
        <FadeIn delay={100}>
          <LicitationInfoCard licitation={licitation} />
        </FadeIn>

        {/* Client side interactive part (Tabs, Dialogs, etc) */}
        <LicitationDetailClient 
          licitationId={licitationId}
          initialLicitation={licitation}
          initialQuotation={quotation}
          initialAdjudications={adjudications}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading licitation detail on server:", error);
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Ocurrió un error al cargar la licitación.</p>
        <Link href="/dashboard/licitaciones">
          <Button className="mt-4">Volver al listado</Button>
        </Link>
      </div>
    );
  }
}
