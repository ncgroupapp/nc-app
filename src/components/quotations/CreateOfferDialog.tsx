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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { offersService, Offer, CreateOfferDto } from "@/services/offers.service";
import { productsService, Product } from "@/services/products.service";
import { proveedoresService } from "@/services/proveedores.service";
import { Proveedor } from "@/types";

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
  
  // Options for selects
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Proveedor[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load products and providers when dialog opens
  useEffect(() => {
    if (open) {
      const loadOptions = async () => {
        setLoadingOptions(true);
        try {
          const [productsRes, providersRes] = await Promise.all([
            productsService.getAll({ limit: 100 }),
            proveedoresService.getAll({ limit: 100 }),
          ]);
          setProducts(productsRes.data || []);
          setProviders(providersRes.data || []);
        } catch (err) {
          console.error("Error loading options:", err);
        } finally {
          setLoadingOptions(false);
        }
      };
      loadOptions();
      
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
      setError(null);
    }
  }, [open, initialProductId]);

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
    if (!formData.deliveryDate) {
      setError("Seleccione una fecha de entrega");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newOffer = await offersService.create(formData);
      onOfferCreated(newOffer);
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating offer:", err);
      setError("Error al crear la oferta");
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.productId > 0 && formData.providerId > 0 && formData.price > 0 && formData.quantity >= 1 && !!formData.deliveryDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Oferta</DialogTitle>
          <DialogDescription>
            Complete los datos para registrar una nueva oferta de proveedor
          </DialogDescription>
        </DialogHeader>

        {loadingOptions ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-950" />
            <p className="text-sm text-blue-950 mt-2">Cargando opciones...</p>
          </div>
        ) : (
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
                <Label>Fecha de Entrega *</Label>
                <Input
                  type="date"
                  value={formData.deliveryDate ? new Date(formData.deliveryDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deliveryDate: e.target.value }))}
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
              <Select
                value={formData.productId ? formData.productId.toString() : ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, productId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} {product.brand ? `(${product.brand})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Select
                value={formData.providerId ? formData.providerId.toString() : ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, providerId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor..." />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !isValid || loadingOptions}>
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
