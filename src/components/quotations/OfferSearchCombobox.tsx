"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { offersService, Offer } from "@/services/offers.service";
import { CreateOfferDialog } from "./CreateOfferDialog";

type OfferSearchComboboxProps = {
  productId?: number;
  onSelectOffer: (offer: Offer) => void;
  placeholder?: string;
  disabled?: boolean;
  showCreateButton?: boolean;
};

export function OfferSearchCombobox({
  productId,
  onSelectOffer,
  placeholder = "Buscar oferta...",
  disabled = false,
  showCreateButton = true,
}: OfferSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    const fetchOffers = async () => {
      // Don't fetch if closed and no active search/filter, unless we have initial offers
      if (!open && !search && !productId && offers.length === 0) return;

      try {
        setLoading(true);
        // If no search and no productId, fetch top 3 recent offers
        const limit = (!search && !productId) ? 3 : 20;
        
        const response = await offersService.getAll({
          search: search || undefined,
          productId: productId,
          limit: limit,
        });
        setOffers(response.data || []);
      } catch (error) {
        console.error("Error fetching offers:", error);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchOffers, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, productId, open]);



  const handleSelect = (offer: Offer) => {
    setSelectedOffer(offer);
    onSelectOffer(offer);
    setOpen(false);
  };

  const handleOfferCreated = (offer: Offer) => {
    // Select the newly created offer
    setSelectedOffer(offer);
    onSelectOffer(offer);
    // Add to list if not already present
    setOffers((prev) => {
      if (prev.some((o) => o.id === offer.id)) return prev;
      return [offer, ...prev];
    });
  };

  const handleOpenCreateDialog = () => {
    setOpen(false);
    setCreateDialogOpen(true);
  };

  const formatOfferLabel = (offer: Offer) => {
    const name = offer.name || offer.product?.name || `Oferta #${offer.id}`;
    const provider = offer.provider?.name || offer.providerName || "Sin proveedor";
    return `${name} - $${offer.price} (${provider})`;
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedOffer ? (
              <span className="truncate">{formatOfferLabel(selectedOffer)}</span>
            ) : (
              <span className="text-blue-950">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nombre, proveedor..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-950" />
                  <p className="text-sm text-blue-950 mt-2">Buscando ofertas...</p>
                </div>
              ) : offers.length === 0 ? (
                <CommandEmpty>
                  <div className="py-2">
                    <p className="text-sm text-blue-950 mb-3">
                      {search || productId
                        ? "No se encontraron ofertas"
                        : "No hay ofertas recientes"}
                    </p>
                    {showCreateButton && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenCreateDialog}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Nueva Oferta
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
              ) : (
                <>
                  <CommandGroup heading="Ofertas disponibles">
                    {offers.map((offer) => (
                      <CommandItem
                        key={offer.id}
                        value={offer.id.toString()}
                        onSelect={() => handleSelect(offer)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedOffer?.id === offer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{offer.name || offer.product?.name || `Oferta #${offer.id}`}</span>
                          <span className="text-xs text-blue-950">
                            ${offer.price} - {offer.provider?.name || offer.providerName} - Stock: {offer.quantity}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {showCreateButton && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleOpenCreateDialog}
                        className="w-full justify-start text-blue-950 hover:text-foreground"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Nueva Oferta
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateOfferDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onOfferCreated={handleOfferCreated}
        initialProductId={productId}
      />
    </>
  );
}
