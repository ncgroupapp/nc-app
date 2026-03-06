"use client";

import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/common/fade-in";

// Local imports
import { useClientDetail } from "./hooks/use-client-detail";
import { ClientHeader } from "./components/client-header";
import { ClientInfoCard } from "./components/client-info-card";
import { ClientContactsCard } from "./components/client-contacts-card";
import { ClientQuotationsTab } from "./components/client-quotations-tab";
import { ClientAdjudicationsTab } from "./components/client-adjudications-tab";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    client,
    quotations,
    adjudications,
    loading,
    error,
  } = useClientDetail(id);

  if (loading) {
    return <ClientDetailSkeleton />;
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[60vh] text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {error || "No pudimos encontrar el cliente que estás buscando. Puede que haya sido eliminado o el ID sea incorrecto."}
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
        <ClientHeader client={client} />
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Info & Contacts */}
        <div className="lg:col-span-4 space-y-6">
          <FadeIn delay={100}>
            <ClientInfoCard client={client} />
          </FadeIn>

          <FadeIn delay={200}>
            <ClientContactsCard contacts={client.contacts} />
          </FadeIn>
        </div>

        {/* Right Column: History Tabs */}
        <div className="lg:col-span-8">
          <FadeIn delay={300}>
            <Tabs defaultValue="quotations" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1 h-auto mb-6">
                <TabsTrigger 
                  value="quotations" 
                  className="data-[state=active]:bg-background py-2 transition-all"
                >
                  Cotizaciones ({quotations.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="adjudications"
                  className="data-[state=active]:bg-background py-2 transition-all"
                >
                  Adjudicaciones ({adjudications.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="quotations" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <ClientQuotationsTab quotations={quotations} />
              </TabsContent>

              <TabsContent value="adjudications" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <ClientAdjudicationsTab adjudications={adjudications} />
              </TabsContent>
            </Tabs>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function ClientDetailSkeleton() {
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
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
