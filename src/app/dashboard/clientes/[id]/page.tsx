import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/common/fade-in";
import { clientesService } from "@/services/clientes.service";
import { cotizacionesService } from "@/services/cotizaciones.service";
import { adjudicacionesService } from "@/services/adjudicaciones.service";

// Local imports
import { ClientHeader } from "./components/client-header";
import { ClientInfoCard } from "./components/client-info-card";
import { ClientContactsCard } from "./components/client-contacts-card";
import { ClientTabs } from "./components/client-tabs"; // We'll create this

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    // Parallel fetching on the server - Eliminates Waterfalls
    const [clientRes, quotations, adjudications] = await Promise.all([
      clientesService.getById(id),
      cotizacionesService.getByClientId(id),
      adjudicacionesService.getByClientId(id)
    ]);

    const client = clientRes.data;

    if (!client) {
      return <ErrorState message="No se encontró el cliente solicitado." />;
    }

    return (
      <div className="space-y-8 pb-8">
        <FadeIn direction="none">
          <ClientHeader client={client} />
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <FadeIn delay={100}>
              <ClientInfoCard client={client} />
            </FadeIn>

            <FadeIn delay={200}>
              <ClientContactsCard contacts={client.contacts || []} />
            </FadeIn>
          </div>

          <div className="lg:col-span-8">
            <FadeIn delay={300}>
              <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <ClientTabs 
                  quotations={quotations} 
                  adjudications={adjudications} 
                />
              </Suspense>
            </FadeIn>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading client detail on server:", error);
    return <ErrorState message="Ocurrió un error al cargar los datos del cliente." />;
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
      <Button asChild>
        <a href="/dashboard/clientes">Volver al listado</a>
      </Button>
    </div>
  );
}
