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
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import { showSnackbar } from '@/components/ui/snackbar'
import { CreateProductForm, Product } from '@/services/products.service'
import { proveedoresService } from '@/services/proveedores.service'
import { useProductsStore } from '@/stores'
import { Proveedor } from '@/types'
import { AlertTriangle, Package, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProductForm } from '@/components/productos/product-form'

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

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProveedor, setSelectedProveedor] = useState<string>('all')
  const [proveedorSearch, setProveedorSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Proveedor[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchProducts(1)
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

  const handleProductSubmit = async (data: CreateProductForm) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data)
        showSnackbar('Producto actualizado correctamente', 'success')
      } else {
        await createProduct(data)
        showSnackbar('Producto creado correctamente', 'success')
      }
      setIsCreateDialogOpen(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Error saving product:', error)
      showSnackbar('Error al guardar el producto: ' + (error as Error).message, 'error')
    }
  }

  const handleView = (product: Product) => {
    router.push(`/dashboard/productos/${product.id}`)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
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
      setTimeout(() => setEditingProduct(null), 300)
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
            <AlertTriangle className="h-4 w-4 text-warning" />
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
            <Button onClick={() => setEditingProduct(null)}>
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
            <ProductForm
              initialData={editingProduct}
              onSubmit={handleProductSubmit}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={isLoading}
            />
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, código, marca o modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <MultiSelectSearch
                single={true}
                options={[
                  { id: "all", label: "Todos los proveedores" },
                  ...searchResults.map((proveedor) => ({
                    id: proveedor.id,
                    label: `${proveedor.name}`,
                  })),
                ]}
                selectedValues={
                  selectedProveedor === "all"
                    ? ["all"]
                    : [parseInt(selectedProveedor)]
                }
                onSelect={(val) => {
                  if (val === "all") {
                    setSelectedProveedor("all");
                  } else {
                    const id = typeof val === "string" ? parseInt(val) : val;
                    setSelectedProveedor(id.toString());
                  }
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