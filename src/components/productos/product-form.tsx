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
import { useMarcasStore, useProveedoresStore } from '@/stores'
import { Upload, X } from "lucide-react";
import { useEffect, useState, useMemo } from 'react'

interface ProductFormProps {
  initialData?: Product | null
  onSubmit: (data: CreateProductForm) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ProductForm({ initialData, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const { proveedores, fetchProveedores } = useProveedoresStore()
  const { brands, fetchBrands, fetchBrandById, models } = useMarcasStore()

  const [brandSearch, setBrandSearch] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [providerSearch, setProviderSearch] = useState('')
  const [formData, setFormData] = useState<CreateProductForm>({
    name: '',
    images: [],
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
  
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Memoize options to include initial selected providers
  const providerOptions = useMemo(() => {
    // Current options from store
    const options = proveedores.map((p) => ({
      id: parseInt(p.id),
      label: p.name,
    }));

    // Add initial providers if they are not in the list (to show name instead of ID)
    if (initialData?.providers) {
      initialData.providers.forEach((provider) => {
        if (!options.find((o) => o.id === provider.id)) {
          options.push({
            id: provider.id,
            label: provider.name,
          });
        }
      });
    }

    return options;
  }, [proveedores, initialData]);

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProveedores(1, providerSearch);
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerSearch]);

  // Model search - No backend search, just filter locally (by default filter logic in MultiSelectSearch if shouldFilter=true)
  // But MultiSelectSearch can handle local filtering if we don't pass searchValue or we pass it and implement local logic?
  // MultiSelectSearch defaults to local filtering if shouldFilter is true.
  // Wait, if I want to "search by backend" but endpoint doesn't exist, I'm just getting ALL models for the brand
  // and then client-side filtering.
  // So I don't need a timeout effect for modelSearch.
  // I only need to fetchBrandById when brand changes, which is handled in onSelect for brand.

  // Set initial data

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        images: initialData.images || (initialData.image ? [initialData.image] : []),
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
      setImagePreviews(initialData.images || (initialData.image ? [initialData.image] : []))
      
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
            images: [],
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
          setImagePreviews([])
          setImageFiles([])
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

    if (imagePreviews.length === 0) {
      showSnackbar('Al menos una imagen del producto es obligatoria', 'error')
      return
    }

    try {
      const uploadedUrls: string[] = []
      
      setIsUploadingImage(true)
      
      const newImageUrls: string[] = []
      
      if (imageFiles.length > 0) {
        try {
          // Upload all files in parallel
          const uploadPromises = imageFiles.map(file => uploadProductImage(file))
          const results = await Promise.all(uploadPromises)
          newImageUrls.push(...results)
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError)
          showSnackbar('Error al subir las imagenes', 'error')
          setIsUploadingImage(false)
          return
        }
      }
      
      // Combine existing URLs (from previews that are not data URLs) with new URLs
      // Note: This logic appends new images at the end. If user deleted a new image from preview... 
      // We need to handle that.
      // If we just sync `imageFiles` with `imagePreviews` (i.e. if user deletes a preview, we remove the file),
      // then `imageFiles` contains exactly what needs to be uploaded.
      
      // Let's assume for now I will implement the deletion logic correctly in the render section.
      
      const existingUrls = imagePreviews.filter(url => url.startsWith('http') || url.startsWith('https'))
      const finalImages = [...existingUrls, ...newImageUrls]
      
      if (finalImages.length === 0) { 
          // Should have been caught by initial check, but just in case
          setIsUploadingImage(false);
          return; 
      }

      const dataToSubmit = { ...formData, images: finalImages }
      await onSubmit(dataToSubmit)
      setIsUploadingImage(false)
      
    } catch (error) {
      console.error('Error saving product:', error)
      setIsUploadingImage(false)
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
                options={providerOptions}
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
                searchValue={providerSearch}
                onSearchValueChange={setProviderSearch} 
                shouldFilter={false}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Imágenes del Producto <span className="text-red-500">*</span></Label>
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square border rounded-md overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        // Check if it's an existing URL or a new file preview
                        const isExisting = preview.startsWith('http') || preview.startsWith('https');
                        
                        if (isExisting) {
                           // Just remove from previews
                           setImagePreviews(prev => prev.filter((_, i) => i !== index));
                        } else {
                           // If it's a data URL, we need to find which file it corresponds to in imageFiles.
                           // Since we append files, and previews are [existing, ...new], 
                           // we can calculate the index in imageFiles.
                           const existingCount = imagePreviews.filter(p => p.startsWith('http') || p.startsWith('https')).length;
                           // But wait, if I delete an existing one, existingCount changes.
                           // This index logic is fragile if we mix deletions.
                           
                           // Robust way: Store objects { type: 'url' | 'file', content: string | File, id: string }
                           // But I don't want to refactor everything.
                           
                           // Hacky way: Assume we don't mix reordering much. 
                           // Actually, let's look at `index`. 
                           // `imagePreviews` contains ALL images.
                           // `imageFiles` contains ONLY new files.
                           
                           // If I delete item at `index`, I remove it from `imagePreviews`.
                           // If it was a new file, I also need to remove it from `imageFiles`.
                           // Which file was it?
                           
                           // Let's filter `imagePreviews` to see how many non-http strings were BEFORE this index.
                           // That count gives the index in `imageFiles`.
                           
                           const nonHttpBefore = imagePreviews.slice(0, index).filter(p => !p.startsWith('http') && !p.startsWith('https')).length;
                           setImageFiles(prev => prev.filter((_, i) => i !== nonHttpBefore));
                           setImagePreviews(prev => prev.filter((_, i) => i !== index));
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center justify-center aspect-square border-2 border-dashed rounded-md hover:bg-slate-50 cursor-pointer relative">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        setImageFiles(prev => [...prev, ...files]);
                        
                        // Generate previews
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImagePreviews(prev => [...prev, reader.result as string]);
                          };
                          reader.readAsDataURL(file);
                        });
                      }
                      // Reset value to allow selecting same files again if needed
                      e.target.value = ''; 
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center p-2">
                    <Upload className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500">Subir imágenes</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-blue-950">
                Formatos aceptados: JPG, PNG, GIF. Máx 5MB per imagen.
              </p>
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
                options={models.map((m) => ({
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
        <Button type="submit" disabled={isLoading || isUploadingImage || !formData.name || imagePreviews.length === 0}>
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