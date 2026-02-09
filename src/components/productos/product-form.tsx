'use client'

import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import { ScrollArea } from '@/components/ui/scroll-area'
import { showSnackbar } from '@/components/ui/snackbar'
import { uploadProductImage } from '@/lib/firebase'
import { CreateProductForm, Product } from '@/services/products.service'
import { useBrandsStore } from '@/stores/brands/brandsStore'
import { useProveedoresStore } from '@/stores'
import { Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ProductFormProps {
  initialData?: Product | null
  onSubmit: (data: CreateProductForm) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ProductForm({ initialData, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const { proveedores, fetchProveedores } = useProveedoresStore()
  const { brands, fetchBrands, fetchBrandById } = useBrandsStore()

  const [brandSearch, setBrandSearch] = useState('')
  const [formData, setFormData] = useState<CreateProductForm>({
    name: '',
    image: '',
    providerIds: [],
    brand: '',
    model: '',
    code: '',
    equivalentCodes: [],
    price: 0,
    description: '',
    stockQuantity: 0,
    stock: 0,
    details: '',
    observations: '',
    chassis: '',
    motor: '',
    equipment: ''
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Initial load
  useEffect(() => {
    fetchProveedores(1)
    fetchBrands(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Brand search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBrands(1, brandSearch)
    }, 300)
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandSearch])

  // Set initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        image: initialData.image || '',
        providerIds: initialData.providers?.map(p => p.id) || [],
        brand: initialData.brand || '',
        model: initialData.model || '',
        code: initialData.code || '',
        equivalentCodes: initialData.equivalentCodes || [],
        price: initialData.price || 0,
        description: initialData.description || '',
        stockQuantity: initialData.stockQuantity || 0,
        stock: initialData.stockQuantity || 0,
        details: initialData.details || '',
        observations: initialData.observations || '',
        chassis: initialData.chassis || '',
        motor: initialData.motor || '',
        equipment: initialData.equipment || ''
      })
      setImagePreview(initialData.image || '')
      
      // If there is a brand, fetch details to populate models
      if (initialData.brand) {
         // We need to find the brand ID to fetch details. 
         // Since brands might not be loaded yet or we only have the name, 
         // we might rely on the store having loaded brands or searching.
         // However, MultiSelectSearch for brand uses `brands` from store.
         // Let's try to match it if available, otherwise fetchBrands might eventually populate it.
         // But `fetchBrandById` needs an ID. 
         // Strategy: The brands list from `fetchBrands(1)` should contain it or we might need to search specifically?
         // In page.tsx logic: 
         /* 
            const brandObj = brands.find((b) => b.name === brandName);
            if (brandObj) { fetchBrandById(brandObj.id); }
         */
         // We can do this in the effect if brands are available.
      }
    } else {
        // Reset form
        setFormData({
            name: '',
            image: '',
            providerIds: [],
            brand: '',
            model: '',
            code: '',
            equivalentCodes: [],
            price: 0,
            description: '',
            stockQuantity: 0,
            stock: 0,
            details: '',
            observations: '',
            chassis: '',
            motor: '',
            equipment: ''
          })
          setImagePreview('')
          setImageFile(null)
    }
  }, [initialData])

  // Effect to load models when brands change or initialBrand is set
  useEffect(() => {
      if (formData.brand && brands.length > 0) {
          const brandObj = brands.find(b => b.name === formData.brand)
          if (brandObj) {
              fetchBrandById(brandObj.id)
          }
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.brand, brands.length]) // Added brands.length to retry when brands load

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let imageUrl = formData.image

      // Upload image to Firebase if a new file was selected
      if (imageFile) {
        setIsUploadingImage(true)
        try {
          imageUrl = await uploadProductImage(imageFile)
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          showSnackbar('Error al subir la imagen', 'error')
          setIsUploadingImage(false)
          return
        }
        setIsUploadingImage(false)
      }

      const dataToSubmit = { ...formData, image: imageUrl }
      await onSubmit(dataToSubmit)
      
    } catch (error) {
      console.error('Error saving product:', error)
      // Error handling is typically done by parent or here. 
      // If parent throws, we catch it here.
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ScrollArea className="h-[60vh] pr-4">
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Ej: Laptop Dell XPS 15"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proveedor_id">Proveedores</Label>
              <MultiSelectSearch
                options={proveedores.map((p) => ({
                  id: p.id,
                  label: p.name,
                }))}
                selectedValues={formData.providerIds || []}
                onSelect={(value) => {
                  const id =
                    typeof value === "string" ? parseInt(value) : value;
                  setFormData((prev) => ({
                    ...prev,
                    providerIds: [...(prev.providerIds || []), id],
                  }));
                }}
                onRemove={(value) => {
                  const id =
                    typeof value === "string" ? parseInt(value) : value;
                  setFormData((prev) => ({
                    ...prev,
                    providerIds: (prev.providerIds || []).filter(
                      (pid) => pid !== id,
                    ),
                  }));
                }}
                placeholder="Seleccionar proveedores..."
                searchPlaceholder="Buscar proveedor..."
                emptyMessage="No se encontraron proveedores."
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Imagen del Producto</Label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setImageFile(null);
                      setFormData((prev) => ({ ...prev, image: "" }));
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceptados: JPG, PNG, GIF. Máx 5MB
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <MultiSelectSearch
                single={true}
                shouldFilter={false}
                searchValue={brandSearch}
                onSearchValueChange={setBrandSearch}
                options={brands.map((b) => ({
                  id: b.name,
                  label: b.name,
                }))}
                selectedValues={formData.brand ? [formData.brand] : []}
                onSelect={(value) => {
                  const brandName = value as string;
                  setFormData((prev) => ({
                    ...prev,
                    brand: brandName,
                    model: "",
                  }));
                  // Fetch models for this brand
                  const brandObj = brands.find(
                    (b) => b.name === brandName,
                  );
                  if (brandObj) {
                    fetchBrandById(brandObj.id);
                  }
                }}
                onRemove={() =>
                  setFormData((prev) => ({
                    ...prev,
                    brand: "",
                    model: "",
                  }))
                }
                placeholder="Seleccionar marca..."
                searchPlaceholder="Buscar marca..."
                emptyMessage="No se encontraron marcas."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <MultiSelectSearch
                single={true}
                options={
                  brands
                    .find((b) => b.name === formData.brand)
                    ?.models?.map((m) => ({
                      id: m.name,
                      label: m.name,
                    })) || []
                }
                selectedValues={formData.model ? [formData.model] : []}
                onSelect={(value) => {
                  const modelName = value as string;
                  setFormData((prev) => ({
                    ...prev,
                    model: modelName,
                  }));
                }}
                onRemove={() =>
                  setFormData((prev) => ({
                    ...prev,
                    model: "",
                  }))
                }
                placeholder="Seleccionar modelo..."
                searchPlaceholder="Buscar modelo..."
                emptyMessage={
                  formData.brand
                    ? "No se encontraron modelos."
                    : "Seleccione una marca primero."
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value,
                  }))
                }
                placeholder="Código principal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equivalentCodes">
                Códigos Equivalentes
              </Label>
              <Input
                id="equivalentCodes"
                value={formData.equivalentCodes?.join(", ") || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    equivalentCodes: e.target.value
                      .split(",")
                      .map((s) => s.trim()),
                  }))
                }
                placeholder="Separados por coma"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Cantidad en Stock</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stockQuantity: parseInt(e.target.value) || 0,
                    stock: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              className="w-full p-3 border rounded-md"
              rows={2}
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Descripción corta..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Detalles</Label>
            <textarea
              id="details"
              className="w-full p-3 border rounded-md"
              rows={3}
              value={formData.details}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  details: e.target.value,
                }))
              }
              placeholder="Descripción detallada del producto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chassis">Chasis</Label>
              <Input
                id="chassis"
                value={formData.chassis}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    chassis: e.target.value,
                  }))
                }
                placeholder="Número de chasis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motor">Motor</Label>
              <Input
                id="motor"
                value={formData.motor}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    motor: e.target.value,
                  }))
                }
                placeholder="Número de motor"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment">Equipamiento</Label>
            <textarea
              id="equipment"
              className="w-full p-3 border rounded-md"
              rows={3}
              value={formData.equipment}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  equipment: e.target.value,
                }))
              }
              placeholder="Descripción del equipamiento del producto..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones</Label>
            <textarea
              id="observations"
              className="w-full p-3 border rounded-md"
              rows={2}
              value={formData.observations}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  observations: e.target.value,
                }))
              }
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>
      </ScrollArea>
      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || isUploadingImage}>
          {isUploadingImage ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Subiendo imagen...
            </>
          ) : isLoading ? (
            "Guardando..."
          ) : (
            `${initialData ? "Actualizar" : "Crear"} Producto`
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
