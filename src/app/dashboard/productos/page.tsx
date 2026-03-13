'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Package, Plus } from "lucide-react"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTableColumn } from '@/components/ui/data-table'
import { ActionCell } from '@/components/ui/data-table-cells'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import { showSnackbar } from '@/components/ui/snackbar'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { ProductForm } from '@/components/productos/product-form'

import { useConfirm } from '@/hooks/use-confirm'
import { useDebounce } from '@/hooks/use-debounce'
import { useProductsStore } from '@/stores/products/productsStore'
import { proveedoresService } from '@/services/proveedores.service'
import { CreateProductForm, Product } from '@/services/products.service'
import { Proveedor } from '@/types/proveedor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Search } from "lucide-react"

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
  } = useProductsStore()

  const { confirm } = useConfirm()

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [selectedProveedor, setSelectedProveedor] = useState<string>('all')
  const [proveedorSearch, setProveedorSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Proveedor[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Initial fetch
  useEffect(() => {
    fetchProducts(1)
  }, [fetchProducts])

  // Sync search and filter
  useEffect(() => {
    const providerId = selectedProveedor !== 'all' ? parseInt(selectedProveedor) : undefined
    fetchProducts(1, debouncedSearch || undefined, providerId)
  }, [debouncedSearch, selectedProveedor, fetchProducts])

  // Provider search for filter
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await proveedoresService.getAll({
          search: proveedorSearch,
        })
        setSearchResults(response.data || [])
      } catch (error) {
        console.error('Error searching providers:', error)
      }
    }

    const timeoutId = setTimeout(fetchProviders, 300)
    return () => clearTimeout(timeoutId)
  }, [proveedorSearch])

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
      showSnackbar('Error al guardar el producto', 'error')
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
    const confirmed = await confirm({
      title: 'Eliminar Producto',
      message: '¿Está seguro que desea eliminar este producto?',
      variant: 'destructive'
    })
    
    if (confirmed) {
      try {
        await deleteProduct(id)
        showSnackbar('Producto eliminado correctamente', 'success')
      } catch (error) {
        console.error('Error deleting product:', error)
        showSnackbar("Error al eliminar el producto", "error")
      }
    }
  }

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'image',
      header: 'Imagen',
      render: (product) => (
        <div className="flex items-center justify-center w-12 h-12 rounded-md overflow-hidden border bg-muted/20">
          {product.images && product.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      )
    },
    { key: 'code', header: 'Código', accessorKey: 'code' },
    { key: 'name', header: 'Nombre', accessorKey: 'name', className: 'font-medium' },
    { 
      key: 'brand_model', 
      header: 'Marca/Modelo', 
      render: (product) => (
        <span className="text-sm">
          {product.brand && product.model ? `${product.brand} ${product.model}` : product.brand || product.model || '-'}
        </span>
      ) 
    },
    { 
      key: 'provider', 
      header: 'Proveedores', 
      render: (product) => (
        <span className="text-sm text-muted-foreground line-clamp-1">
          {product.providers?.map(p => p.name).join(', ') || '-'}
        </span>
      ) 
    },
    { 
      key: 'stock', 
      header: 'Stock', 
      render: (product) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{product.stockQuantity ?? 0}</span>
          {(product.stockQuantity ?? 0) <= 5 && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
        </div>
      ) 
    },
    { 
      key: 'status', 
      header: 'Estado', 
      render: (product) => { 
        const status = getStockStatus(product.stockQuantity); 
        return <Badge variant={status.variant}>{status.label}</Badge>
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
      <FadeIn direction="none">
        <PageHeader 
          title="Productos"
          subtitle="Gestión del inventario de productos"
          backButton={false}
          actions={
            <Button onClick={() => { setEditingProduct(null); setIsCreateDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
            </Button>
          }
        />
      </FadeIn>

      <FadeIn delay={100}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" /> Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <SearchInput 
                  placeholder="Buscar por nombre, código, marca o modelo..." 
                  value={searchTerm} 
                  onChange={setSearchTerm} 
                />
              </div>
              <div className="w-full md:w-64">
                <MultiSelectSearch 
                  single={true} 
                  options={[
                    { id: "all", label: "Todos los proveedores" }, 
                    ...searchResults.map((p) => ({ id: p.id, label: p.name }))
                  ]} 
                  selectedValues={selectedProveedor === "all" ? ["all"] : [parseInt(selectedProveedor)]} 
                  onSelect={(val) => { 
                    if (val === "all") { 
                      setSelectedProveedor("all"); 
                    } else { 
                      const id = typeof val === "string" ? parseInt(val) : val; 
                      setSelectedProveedor(id.toString()); 
                    } 
                  }} 
                  onRemove={() => setSelectedProveedor("all")} 
                  placeholder="Filtrar por proveedor" 
                  searchPlaceholder="Buscar proveedor..." 
                  searchValue={proveedorSearch} 
                  onSearchValueChange={setProveedorSearch} 
                  shouldFilter={false} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={200}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Listado de Productos</span>
              <Badge variant="outline">{pagination.total} productos</Badge>
            </CardTitle>
            <CardDescription>Gestione el inventario y stock de productos</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={products} 
              isLoading={isLoading} 
              pagination={{ 
                page: pagination.page, 
                limit: pagination.limit, 
                total: pagination.total, 
                totalPages: pagination.lastPage, 
                onPageChange: (page) => {
                  const providerId = selectedProveedor !== "all" ? parseInt(selectedProveedor) : undefined;
                  fetchProducts(page, debouncedSearch || undefined, providerId);
                }, 
              }} 
              emptyMessage="No se encontraron productos" 
            />
          </CardContent>
        </Card>
      </FadeIn>

      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) setTimeout(() => setEditingProduct(null), 300);
      }}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Crear Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              Complete los datos del producto para {editingProduct ? "actualizar" : "crear"} el registro.
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
  )
}
