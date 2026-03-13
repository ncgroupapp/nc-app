"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductQuotationsTab } from "./product-quotations-tab";
import { ProductAdjudicationsTab } from "./product-adjudications-tab";
import { ProductOffersTab } from "./product-offers-tab";
import { ProductWinnersTab } from "./product-winners-tab";
import { Quotation } from "@/services/cotizaciones.service";
import { Offer } from "@/services/offers.service";

interface ProductTabsProps {
  productId: number;
  quotationHistory: Quotation[];
  adjudicationHistory: unknown[];
  offersHistory: Offer[];
  winnersHistory: any[];
}

export function ProductTabs({ productId, quotationHistory, adjudicationHistory, offersHistory, winnersHistory }: ProductTabsProps) {
  return (
    <Tabs defaultValue="quotations" className="w-full">
      <TabsList className="w-full grid grid-cols-4 bg-muted/50 p-1 h-auto mb-6 border">
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
        <TabsTrigger 
          value="offers"
          className="data-[state=active]:bg-background py-2 transition-all font-bold"
        >
          Ofertas ({offersHistory.length})
        </TabsTrigger>
        <TabsTrigger 
          value="winners"
          className="data-[state=active]:bg-background py-2 transition-all font-bold"
        >
          Ganadores ({winnersHistory?.length || 0})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="quotations" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ProductQuotationsTab quotations={quotationHistory} productId={productId} />
      </TabsContent>

      <TabsContent value="adjudications" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ProductAdjudicationsTab adjudications={adjudicationHistory as any} productId={productId} />
      </TabsContent>

      <TabsContent value="offers" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ProductOffersTab offers={offersHistory} productId={productId} />
      </TabsContent>

      <TabsContent value="winners" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ProductWinnersTab winners={winnersHistory} productId={productId} />
      </TabsContent>
    </Tabs>
  );
}

