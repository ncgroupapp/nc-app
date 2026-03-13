'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  Loader2,
} from "lucide-react";
import { CreateOfferDto, Offer } from '@/services/offers.service';
import { productsService, Product } from '@/services/products.service';
import { proveedoresService } from '@/services/proveedores.service';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { Proveedor } from '@/types';
import { MultiSelectSearch } from '@/components/ui/multi-select-search';
import { useDebounce } from '@/hooks/use-debounce';
import { DialogFooter } from '@/components/ui/dialog';

interface OfferFormProps {
  initialData?: Offer | null;
  onSubmit: (data: CreateOfferDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OfferForm({ initialData, onSubmit, onCancel, isLoading = false }: OfferFormProps) {
  const [formData, setFormData] = useState<CreateOfferDto>({
    name: '',
    productId: 0,
    providerId: 0,
    price: 0,
    deliveryDate: '',
    quantity: 1,
    origin: '',
    delivery: 0
  });

  // State for autocompletes
  const [dialogProductSearch, setDialogProductSearch] = useState('');
  const debouncedDialogProductSearch = useDebounce(dialogProductSearch, 300);
  const [dialogProviderSearch, setDialogProviderSearch] = useState('');
  const debouncedDialogProviderSearch = useDebounce(dialogProviderSearch, 300);
  
  const [dialogProducts, setDialogProducts] = useState<Product[]>([]);
  const [dialogProviders, setDialogProviders] = useState<Proveedor[]>([]);

  // Initialize form with data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        productId: initialData.productId,
        providerId: initialData.providerId,
        price: initialData.price,
        deliveryDate: initialData.deliveryDate,
        quantity: initialData.quantity,
        delivery: initialData.delivery || 0,
        origin: initialData.origin || ''
      });
      setDialogProductSearch(initialData.product?.name || '');
      setDialogProviderSearch(initialData.provider?.name || '');
    } else {
      setFormData({
        name: '',
        productId: 0,
        providerId: 0,
        price: 0,
        deliveryDate: '',
        quantity: 1,
        delivery: 0,
        origin: ''
      });
      setDialogProductSearch('');
      setDialogProviderSearch('');
    }
  }, [initialData]);

  // Load products for DIALOG autocomplete
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const isSearching = debouncedDialogProductSearch.trim().length > 0;
        const productsRes = await productsService.getAll({ 
          search: isSearching ? debouncedDialogProductSearch : undefined, 
          limit: 20
        });
        setDialogProducts(productsRes.data || []);
      } catch (err) {
        console.error("Error loading dialog products:", err);
      }
    };
    fetchProducts();
  }, [debouncedDialogProductSearch]);

  // Load providers for DIALOG autocomplete
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const isSearching = debouncedDialogProviderSearch.trim().length > 0;
        const providersRes = await proveedoresService.getAll({ 
          search: isSearching ? debouncedDialogProviderSearch : undefined, 
          limit: 20
        });
        setDialogProviders(providersRes.data || []);
      } catch (err) {
        console.error("Error loading dialog providers:", err);
      }
    };
    fetchProviders();
  }, [debouncedDialogProviderSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const isFormValid = 
    formData.name?.trim() !== '' && 
    formData.productId > 0 && 
    formData.providerId > 0 && 
    formData.price > 0 && 
    formData.quantity > 0 &&
    formData.deliveryDate !== '' &&
    new Date(formData.deliveryDate + 'T12:00:00') >= new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre CD
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ej: CD-2024-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryDate">
              Fecha de Cotización <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              date={
                formData.deliveryDate
                  ? new Date(formData.deliveryDate + "T12:00:00")
                  : undefined
              }
              setDate={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  deliveryDate: date ? format(date, "yyyy-MM-dd") : "",
                }))
              }
              disabled={(date) =>
                date < new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Producto <span className="text-red-500">*</span>
            </Label>
            <MultiSelectSearch
              options={dialogProducts.map((prod) => ({
                id: prod.id,
                label: prod.name,
              }))}
              selectedValues={
                formData.productId ? [formData.productId] : []
              }
              onSelect={(id) =>
                setFormData((prev) => ({
                  ...prev,
                  productId: Number(id),
                }))
              }
              onRemove={() =>
                setFormData((prev) => ({ ...prev, productId: 0 }))
              }
              placeholder="Seleccionar producto"
              searchPlaceholder="Buscar producto..."
              searchValue={dialogProductSearch}
              onSearchValueChange={setDialogProductSearch}
              shouldFilter={false}
              single={true}
            />
          </div>
          <div className="space-y-2">
            <Label>
              Proveedor <span className="text-red-500">*</span>
            </Label>
            <MultiSelectSearch
              options={dialogProviders.map((prov) => ({
                id: prov.id,
                label: prov.name,
              }))}
              selectedValues={
                formData.providerId ? [formData.providerId] : []
              }
              onSelect={(id) =>
                setFormData((prev) => ({
                  ...prev,
                  providerId: Number(id),
                }))
              }
              onRemove={() =>
                setFormData((prev) => ({ ...prev, providerId: 0 }))
              }
              placeholder="Seleccionar proveedor"
              searchPlaceholder="Buscar proveedor..."
              searchValue={dialogProviderSearch}
              onSearchValueChange={setDialogProviderSearch}
              shouldFilter={false}
              single={true}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Cantidad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={isNaN(formData.quantity) ? "" : formData.quantity}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  quantity: parseInt(e.target.value),
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">
              Precio Unitario (IVA) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={isNaN(formData.price) ? "" : formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value),
                  }))
                }
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="delivery">Plazo de Entrega (días)</Label>
            <Input
              id="delivery"
              type="number"
              min="0"
              value={
                !formData.delivery && formData.delivery !== 0
                  ? ""
                  : formData.delivery
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  delivery: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="Ej: 15"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="origin">Origen</Label>
            <Input
              id="origin"
              value={formData.origin || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  origin: e.target.value,
                }))
              }
              placeholder="Ej: China"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !isFormValid}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar Oferta"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}