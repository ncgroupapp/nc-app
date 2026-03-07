"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductQuotationsTab } from "./product-quotations-tab";
import { ProductAdjudicationsTab } from "./product-adjudications-tab";

interface ProductTabsProps {
  productId: number;
  quotationHistory: any[];
  adjudicationHistory: any[];
}

export function ProductTabs({ productId, quotationHistory, adjudicationHistory }: ProductTabsProps) {
  return (
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
        <ProductQuotationsTab quotations={quotationHistory} productId={productId} />
      </TabsContent>

      <TabsContent value="adjudications" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ProductAdjudicationsTab adjudications={adjudicationHistory} />
      </TabsContent>
    </Tabs>
  );
}
