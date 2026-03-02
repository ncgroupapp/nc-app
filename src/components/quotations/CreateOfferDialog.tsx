"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MultiSelectSearch } from "@/components/ui/multi-select-search";
import { offersService, Offer, CreateOfferDto } from "@/services/offers.service";
import { productsService, Product } from "@/services/products.service";
import { proveedoresService } from "@/services/proveedores.service";
import { format } from "date-fns";
import { Proveedor } from "@/types";
import { useDebounce } from "@/hooks/use-debounce";

type CreateOfferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOfferCreated: (offer: Offer) => void;
  initialProductId?: number;
};

export function CreateOfferDialog({
  open,
  onOpenChange,
  onOfferCreated,
  initialProductId,
}: CreateOfferDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<CreateOfferDto>({
    name: "",
    productId: initialProductId || 0,
    providerId: 0,
    price: 0,
    quantity: 1,
    origin: "",
    deliveryDate: "",
  });
  
  const [deliveryDays, setDeliveryDays] = useState<number | "">("");
  
  // Options for selects
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Proveedor[]>([]);
  
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 300);

  const [providerSearch, setProviderSearch] = useState("");
  const debouncedProviderSearch = useDebounce(providerSearch, 300);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Reset form with initial productId
      setFormData({
        name: "",
        productId: initialProductId || 0,
        providerId: 0,
        price: 0,
        quantity: 1,
        origin: "",
        deliveryDate: "",
      });
      setDeliveryDays("");
      setProductSearch("");
      setProviderSearch("");
      setError(null);
    }
  }, [open, initialProductId]);

  // Dynamically load products
  useEffect(() => {
    if (!open) return;
    const fetchProducts = async () => {
      try {
        const isSearching = debouncedProductSearch.trim().length > 0;
        const productsRes = await productsService.getAll({ 
          search: isSearching ? debouncedProductSearch : undefined, 
          limit: isSearching ? 20 : 5 
        });
        setProducts(productsRes.data || []);
      } catch (err) {
        console.error("Error loading products:", err);
      }
    };
    fetchProducts();
  }, [open, debouncedProductSearch]);

  // Dynamically load providers
  useEffect(() => {
    if (!open) return;
    const fetchProviders = async () => {
      try {
        const isSearching = debouncedProviderSearch.trim().length > 0;
        const providersRes = await proveedoresService.getAll({ 
          search: isSearching ? debouncedProviderSearch : undefined, 
          limit: isSearching ? 20 : 5 
        });
        setProviders(providersRes.data || []);
      } catch (err) {
        console.error("Error loading providers:", err);
      }
    };
    fetchProviders();
  }, [open, debouncedProviderSearch]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.productId) {
      setError("Seleccione un producto");
      return;
    }
    if (!formData.providerId) {
      setError("Seleccione un proveedor");
      return;
    }
    if (formData.price <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }
    if (formData.quantity < 1) {
      setError("La cantidad debe ser al menos 1");
      return;
    }
    if (deliveryDays === "" || deliveryDays < 0) {
      setError("Ingrese un plazo de entrega válido en días");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const df = new Date();
      df.setDate(df.getDate() + Number(deliveryDays));
      const submitData = {
        ...formData,
        deliveryDate: format(df, "yyyy-MM-dd"),
      };
      
      const newOffer = await offersService.create(submitData);
      onOfferCreated(newOffer);
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating offer:", err);
      setError("Error al crear la oferta");
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.productId > 0 && formData.providerId > 0 && formData.price > 0 && formData.quantity >= 1 && deliveryDays !== "" && deliveryDays >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Oferta</DialogTitle>
          <DialogDescription>
            Complete los datos para registrar una nueva oferta de proveedor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}

            {/* Offer Name */}
            <div className="space-y-2">
              <Label>Nombre de la Oferta (opcional)</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: CD-2024-001"
              />
            </div>

            {/* Delivery Date & Origin */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plazo de Entrega (días) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Ej: 15"
                />
              </div>
              <div className="space-y-2">
                <Label>Origen (opcional)</Label>
                <Input
                  value={formData.origin || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, origin: e.target.value }))}
                  placeholder="Ej: China, USA..."
                />
              </div>
            </div>

            {/* Product */}
            <div className="space-y-2">
              <Label>Producto *</Label>
              <MultiSelectSearch
                options={products.map(p => ({
                  id: p.id,
                  label: `${p.name} ${p.brand ? `(${p.brand})` : ""}`
                }))}
                selectedValues={formData.productId ? [formData.productId] : []}
                onSelect={(id) => setFormData(prev => ({ ...prev, productId: id as number }))}
                onRemove={() => setFormData(prev => ({ ...prev, productId: 0 }))}
                placeholder="Buscar producto..."
                searchValue={productSearch}
                onSearchValueChange={setProductSearch}
                shouldFilter={false} // Let the backend do the filtering
                single={true}
              />
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <MultiSelectSearch
                options={providers.map(p => ({
                  id: p.id,
                  label: p.name
                }))}
                selectedValues={formData.providerId ? [formData.providerId] : []}
                onSelect={(id) => setFormData(prev => ({ ...prev, providerId: id as number }))}
                onRemove={() => setFormData(prev => ({ ...prev, providerId: 0 }))}
                placeholder="Buscar proveedor..."
                searchValue={providerSearch}
                onSearchValueChange={setProviderSearch}
                shouldFilter={false} // Let the backend do the filtering
                single={true}
              />
            </div>

            {/* Price and Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Cantidad Disponible *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                />
              </div>
            </div>
          </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Oferta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
