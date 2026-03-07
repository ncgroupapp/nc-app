"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientQuotationsTab } from "./client-quotations-tab";
import { ClientAdjudicationsTab } from "./client-adjudications-tab";

interface ClientTabsProps {
  quotations: any[];
  adjudications: any[];
}

export function ClientTabs({ quotations, adjudications }: ClientTabsProps) {
  return (
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
  );
}
