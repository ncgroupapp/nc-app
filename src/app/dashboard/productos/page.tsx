'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/hooks/use-confirm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import { ActionCell } from '@/components/ui/data-table-cells'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import { ScrollArea } from '@/components/ui/scroll-area'
import { showSnackbar } from '@/components/ui/snackbar'
import { uploadProductImage } from '@/lib/firebase'
import { CreateProductForm, Product } from '@/services/products.service'
import { proveedoresService } from '@/services/proveedores.service'
import { useProductsStore, useProveedoresStore } from '@/stores'
import { Proveedor } from '@/types'
import { AlertTriangle, Package, Plus, Search, Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProductosPage() {
  const router = useRouter()
  const {
    products,
    isLoading,
    pagination,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    setCurrentPage
  } = useProductsStore()

  const { confirm } = useConfirm()

  const { proveedores, fetchProveedores } = useProveedoresStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProveedor, setSelectedProveedor] = useState<string>('all')
  const [proveedorSearch, setProveedorSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Proveedor[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
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

  useEffect(() => {
    fetchProducts(1)
    fetchProveedores(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced backend search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const providerId = selectedProveedor !== 'all' ? parseInt(selectedProveedor) : undefined
      fetchProducts(1, searchTerm || undefined, providerId)
    }, 300)
    return () => clearTimeout(timeoutId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedProveedor])

  useEffect(() => {
      const fetchProducts = async () => {
        try {
          const response = await  proveedoresService.getAll({
            search: proveedorSearch,
          });
          setSearchResults(response.data || [])
        } catch (error) {
          console.error('Error searching products:', error)
        }
      }
  
      const timeoutId = setTimeout(fetchProducts, 300)
      return () => clearTimeout(timeoutId)
    }, [proveedorSearch]) 

  const filteredProducts = products

  const getStockStatus = (stock?: number) => {
    const stockValue = stock ?? 0
    if (stockValue === 0) return { label: 'Agotado', variant: 'destructive' as const }
    if (stockValue <= 5) return { label: 'Bajo Stock', variant: 'secondary' as const }
    return { label: 'Disponible', variant: 'default' as const }
  }

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

      if (editingProduct) {
        await updateProduct(editingProduct.id, dataToSubmit)
        showSnackbar('Producto actualizado correctamente', 'success')
      } else {
        await createProduct(dataToSubmit)
        showSnackbar('Producto creado correctamente', 'success')
      }

      resetForm()
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Error saving product:', error)
      showSnackbar('Error al guardar el producto: ' + (error as Error).message, 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      providerIds: [],
      brand: '',
      model: '',
      code: '',
      equivalentCodes: [],
      description: '',
      stockQuantity: 0,
      stock: 0,
      details: '',
      observations: '',
      chassis: '',
      motor: '',
      equipment: ''
    })
    setEditingProduct(null)
    setImageFile(null)
    setImagePreview('')
  }

  const handleView = (product: Product) => {
    router.push(`/dashboard/productos/${product.id}`)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      image: product.image || '',
      providerIds: product.providers?.map(p => p.id) || [],
      brand: product.brand || '',
      model: product.model || '',
      code: product.code || '',
      equivalentCodes: product.equivalentCodes || [],
      description: product.description || '',
      stockQuantity: product.stockQuantity || 0,
      stock: product.stockQuantity || 0,
      details: product.details || '',
      observations: product.observations || '',
      chassis: product.chassis || '',
      motor: product.motor || '',
      equipment: product.equipment || ''
    })
    setImagePreview(product.image || '')
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (await confirm({
      title: 'Eliminar Producto',
      message: '¿Está seguro que desea eliminar este producto?',
      variant: 'destructive'
    })) {
      try {
        await deleteProduct(id)
        showSnackbar('Producto eliminado correctamente', 'success')
      } catch (error: unknown) {
        console.error('Error deleting product:', error)
        showSnackbar(
          "Error al eliminar el producto: " +
            (error as { response: { data: { data: { message: string } } } })
              .response.data.data.message,
          "error",
        );
      }
    }
  }

  const handleDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open)
    if (!open) {
      setTimeout(() => resetForm(), 300)
    }
  }

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'image',
      header: 'Imagen',
      render: (product) => (
        product.image ? (
          <div className="relative w-12 h-12 rounded-md overflow-hidden border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
             <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )
      )
    },
    {
      key: 'code',
      header: 'Código',
      accessorKey: 'code',
    },
    {
      key: 'name',
      header: 'Nombre',
      accessorKey: 'name',
      className: 'font-medium'
    },
    {
      key: 'brand_model',
      header: 'Marca/Modelo',
      render: (product) => (
        <span>
          {product.brand && product.model
            ? `${product.brand} ${product.model}`
            : product.brand || product.model || '-'
          }
        </span>
      )
    },
    {
      key: 'provider',
      header: 'Proveedor',
      render: (product) => (
        <span>
          {product.providers?.map(p => p.name).join(', ') || '-'}
        </span>
      )
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (product) => (
        <div className="flex items-center space-x-2">
          <span>{product.stockQuantity ?? 0}</span>
          {(product.stockQuantity ?? 0) <= 5 && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      render: (product) => {
        const stockStatus = getStockStatus(product.stockQuantity)
        return (
          <Badge variant={stockStatus.variant}>
            {stockStatus.label}
          </Badge>
        )
      }
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      render: (product) => (
        <ActionCell 
          row={product}
          onView={handleView}
          onEdit={handleEdit} 
          onDelete={(p) => handleDelete(p.id)} 
        />
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Gestión del inventario de productos
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Producto" : "Crear Nuevo Producto"}
              </DialogTitle>
              <DialogDescription>
                Complete los datos del producto para{" "}
                {editingProduct ? "actualizar" : "crear"} el registro.
              </DialogDescription>
            </DialogHeader>
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
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            brand: e.target.value,
                          }))
                        }
                        placeholder="Ej: Dell"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            model: e.target.value,
                          }))
                        }
                        placeholder="Ej: XPS 15"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Código</Label>
                      <Input
                        id="code"
                        value={formData.code || ''}
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
                       <Label htmlFor="equivalentCodes">Códigos Equivalentes</Label>
                       <Input
                        id="equivalentCodes"
                        value={formData.equivalentCodes?.join(', ') || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            equivalentCodes: e.target.value.split(',').map(s => s.trim()),
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
                            stock: parseInt(e.target.value) || 0
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
                      value={formData.description || ''}
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
                  onClick={() => setIsCreateDialogOpen(false)}
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
                    `${editingProduct ? "Actualizar" : "Crear"} Producto`
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, marca o modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <MultiSelectSearch
                options={searchResults.map((proveedor) => ({
                  id: proveedor.id,
                  label: `${proveedor.name}`,
                }))}
                selectedValues={selectedProveedor === "all" ? [] : [parseInt(selectedProveedor)]}
                onSelect={(val) => {
                  const id =
                    typeof val === "string" ? parseInt(val) : val;
                  setSelectedProveedor(id.toString());
                }}
                onRemove={() => {
                   setSelectedProveedor("all");
                }}
                placeholder="Seleccionar proveedor"
                searchPlaceholder="Buscar proveedor..."
                emptyMessage="No se encontraron proveedores."
                // Search handling
                searchValue={proveedorSearch}
                onSearchValueChange={setProveedorSearch}
                shouldFilter={false}
              />
              {/* <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los proveedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {proveedores.map((proveedor) => (
                    <SelectItem key={proveedor.id} value={proveedor.id}>
                      {proveedor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select> */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Listado de Productos</span>
            <Badge variant="outline">{filteredProducts.length} productos</Badge>
          </CardTitle>
          <CardDescription>
            Gestione el inventario de productos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredProducts}
            columns={columns}
            isLoading={isLoading}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              totalPages: pagination.lastPage,
              onPageChange: (page) => {
                const providerId =
                  selectedProveedor !== "all"
                    ? parseInt(selectedProveedor)
                    : undefined;
                fetchProducts(page, searchTerm || undefined, providerId);
              },
            }}
            emptyMessage="No se encontraron productos"
          />
        </CardContent>
      </Card>
    </div>
  );
}