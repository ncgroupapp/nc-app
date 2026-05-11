"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  Loader2,
  Calendar,
  Package,
  Users,
  Globe,
  Truck,
  Percent,
  Hash,
} from "lucide-react";
import { CreateOfferDto, Offer } from "@/services/offers.service";
import { productsService, Product } from "@/services/products.service";
import { proveedoresService } from "@/services/proveedores.service";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { Proveedor } from "@/types";
import { Currency } from "@/types/enums";
import { MultiSelectSearch } from "@/components/ui/multi-select-search";
import { useDebounce } from "@/hooks/use-debounce";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OfferFormProps {
  initialData?: Offer | null;
  onSubmit: (data: CreateOfferDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

type OfferFormState = CreateOfferDto & { iva: number };

export function OfferForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: OfferFormProps) {
  const [formData, setFormData] = useState<OfferFormState>({
    name: "",
    productId: 0,
    providerId: 0,
    price: 0,
    currency: Currency.CLP,
    iva: 22,
    deliveryDate: "",
    quantity: 1,
    origin: "",
    delivery: 0,
  });

  const [dialogProductSearch, setDialogProductSearch] = useState("");
  const debouncedDialogProductSearch = useDebounce(dialogProductSearch, 300);
  const [dialogProviderSearch, setDialogProviderSearch] = useState("");
  const debouncedDialogProviderSearch = useDebounce(dialogProviderSearch, 300);

  const [dialogProducts, setDialogProducts] = useState<Product[]>([]);
  const [dialogProviders, setDialogProviders] = useState<Proveedor[]>([]);

  useEffect(() => {
    if (initialData) {
      const rawCurrency = initialData.currency;
      const sanitizedCurrency = rawCurrency
        ? (String(rawCurrency).trim() as Currency)
        : undefined;

      setFormData({
        name: initialData.name || "",
        productId: initialData.productId || 0,
        providerId: initialData.providerId || 0,
        price: initialData.price || 0,
        currency: sanitizedCurrency || Currency.USD,
        iva: initialData.iva ?? 22,
        deliveryDate: initialData.deliveryDate || "",
        quantity: initialData.quantity || 1,
        delivery: initialData.delivery || 0,
        origin: initialData.origin || "",
      });
      setDialogProductSearch(initialData.product?.name || "");
      setDialogProviderSearch(initialData.provider?.name || "");
    } else {
      setFormData({
        name: "",
        productId: 0,
        providerId: 0,
        price: 0,
        currency: Currency.USD,
        iva: 22,
        deliveryDate: "",
        quantity: 1,
        delivery: 0,
        origin: "",
      });
      setDialogProductSearch("");
      setDialogProviderSearch("");
    }
  }, [initialData]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const isSearching = debouncedDialogProductSearch.trim().length > 0;
        const productsRes = await productsService.getAll({
          search: isSearching ? debouncedDialogProductSearch : undefined,
          limit: 20,
        });
        setDialogProducts(productsRes.data || []);
      } catch (err) {
        console.error("Error loading dialog products:", err);
      }
    };
    fetchProducts();
  }, [debouncedDialogProductSearch]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const isSearching = debouncedDialogProviderSearch.trim().length > 0;
        const providersRes = await proveedoresService.getAll({
          search: isSearching ? debouncedDialogProviderSearch : undefined,
          limit: 20,
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
    formData.name?.trim() !== "" &&
    formData.productId > 0 &&
    formData.providerId > 0 &&
    formData.price > 0 &&
    formData.quantity > 0 &&
    formData.deliveryDate !== "" &&
    (!!initialData?.id ||
      new Date(formData.deliveryDate + "T12:00:00") >=
        new Date(new Date().setHours(0, 0, 0, 0)));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        {/* Identificación y Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2"
            >
              <Hash className="h-3 w-3" />
              Nombre de la CD
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ej: CD-2024-001"
              className="h-10 focus-visible:ring-primary focus-visible:border-primary border-primary/20"
              required
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="deliveryDate"
              className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2"
            >
              <Calendar className="h-3 w-3" />
              Fecha de Cotización
              <span className="text-red-500">*</span>
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
                !initialData?.id &&
                date < new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
          </div>
        </div>

        {/* Producto y Proveedor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Package className="h-3 w-3" />
              Producto
              <span className="text-red-500">*</span>
            </Label>
            <MultiSelectSearch
              options={dialogProducts.map((prod) => ({
                id: prod.id,
                label: prod.name,
              }))}
              selectedValues={formData.productId ? [formData.productId] : []}
              onSelect={(id) =>
                setFormData((prev) => ({ ...prev, productId: Number(id) }))
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
            <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Users className="h-3 w-3" />
              Proveedor
              <span className="text-red-500">*</span>
            </Label>
            <MultiSelectSearch
              options={dialogProviders.map((prov) => ({
                id: prov.id,
                label: prov.name,
              }))}
              selectedValues={formData.providerId ? [formData.providerId] : []}
              onSelect={(id) =>
                setFormData((prev) => ({ ...prev, providerId: Number(id) }))
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

        {/* Cantidad, Precio y Moneda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/10 rounded-lg border border-muted/50">
          <div className="space-y-2">
            <Label
              htmlFor="quantity"
              className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2"
            >
              <Hash className="h-3 w-3" />
              Cantidad
              <span className="text-red-500">*</span>
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
              className="h-10 border-primary/20 focus-visible:ring-primary"
              required
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="price"
              className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2"
            >
              <DollarSign className="h-3 w-3 text-primary" />
              Precio Unit.
              <span className="text-[10px] opacity-70">(S/IVA)</span>
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-xs font-bold">
                $
              </div>
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
                className="pl-7 h-10 border-primary/20 focus-visible:ring-primary"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="currency"
              className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2"
            >
              <Globe className="h-3 w-3" />
              Moneda
            </Label>
            <Select
              value={formData.currency || Currency.USD}
              onValueChange={(val) =>
                val &&
                setFormData((prev) => ({ ...prev, currency: val as Currency }))
              }
            >
              <SelectTrigger
                id="currency"
                className="h-10 bg-background border-primary/20 focus:ring-primary"
              >
                <SelectValue>{formData.currency || "Moneda"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.values(Currency).map((curr) => (
                  <SelectItem key={curr} value={curr}>
                    {curr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* IVA, Entrega y Origen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="iva"
              className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2"
            >
              <Percent className="h-3 w-3" />
              IVA (%)
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="iva"
              type="number"
              min="0"
              value={
                formData.iva === undefined || isNaN(formData.iva)
                  ? ""
                  : formData.iva
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  iva: parseFloat(e.target.value),
                }))
              }
              className="h-10 border-primary/20 focus-visible:ring-primary focus-visible:border-primary"
              required
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="delivery"
              className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2"
            >
              <Truck className="h-3 w-3" />
              Entrega (días)
            </Label>
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
              className="h-10 border-primary/20 focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="origin"
              className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2"
            >
              <Globe className="h-3 w-3" />
              Origen
            </Label>
            <Input
              id="origin"
              value={formData.origin || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, origin: e.target.value }))
              }
              placeholder="Ej: China"
              className="h-10 border-primary/20 focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>
        </div>
      </div>

      <DialogFooter className="pt-4 border-t border-border mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-full px-6 border-border"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="rounded-full px-8 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            "Guardar Oferta"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
