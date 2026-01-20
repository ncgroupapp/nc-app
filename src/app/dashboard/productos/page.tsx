'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react'
import { useProductsStore } from '@/stores'
import { useProveedoresStore } from '@/stores'
import { Product, CreateProductForm } from '@/services/products.service'
import { showSnackbar } from '@/components/ui/snackbar'

export default function ProductosPage() {
  const {
    products,
    isLoading,
    pagination,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProductsStore()

  const { proveedores, fetchProveedores } = useProveedoresStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProveedor, setSelectedProveedor] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<CreateProductForm>({
    name: '',
    providerIds: [],
    brand: '',
    model: '',
    stockQuantity: 0,
    details: '',
    observations: '',
    chassis: '',
    motor: ''
  })

  useEffect(() => {
    fetchProducts(1)
    fetchProveedores(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced backend search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(1, searchTerm || undefined)
    }, 300)
    return () => clearTimeout(timeoutId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  // Filter by provider locally (backend doesn't support this filter yet)
  const filteredProducts = selectedProveedor === 'all' 
    ? products 
    : products.filter(product => 
        product.providers?.some(p => p.id.toString() === selectedProveedor)
      )

  const getStockStatus = (stock?: number) => {
    const stockValue = stock ?? 0
    if (stockValue === 0) return { label: 'Agotado', variant: 'destructive' as const }
    if (stockValue <= 5) return { label: 'Bajo Stock', variant: 'secondary' as const }
    return { label: 'Disponible', variant: 'default' as const }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData)
        showSnackbar('Producto actualizado correctamente', 'success')
      } else {
        await createProduct(formData)
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
      providerIds: [],
      brand: '',
      model: '',
      stockQuantity: 0,
      details: '',
      observations: '',
      chassis: '',
      motor: ''
    })
    setEditingProduct(null)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      providerIds: product.providers?.map(p => p.id) || [],
      brand: product.brand || '',
      model: product.model || '',
      stockQuantity: product.stockQuantity || 0,
      details: product.details || '',
      observations: product.observations || '',
      chassis: product.chassis || '',
      motor: product.motor || ''
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro que desea eliminar este producto?')) {
      try {
        await deleteProduct(id)
        showSnackbar('Producto eliminado correctamente', 'success')
      } catch (error) {
        console.error('Error deleting product:', error)
        showSnackbar('Error al eliminar el producto: ' + (error as Error).message, 'error')
      }
    }
  }

  const handleDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open)
    if (!open) {
      setTimeout(() => resetForm(), 300)
    }
  }

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
                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                Complete los datos del producto para {editingProduct ? 'actualizar' : 'crear'} el registro.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Laptop Dell XPS 15"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proveedor_id">Proveedor</Label>
                    <Select
                      value={formData.providerIds?.[0]?.toString() || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, providerIds: [parseInt(value)] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {proveedores.map((proveedor) => (
                          <SelectItem key={proveedor.id} value={proveedor.id.toString()}>
                            {proveedor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Ej: Dell"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Ej: XPS 15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Cantidad en Stock</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Detalles</Label>
                  <textarea
                    id="details"
                    className="w-full p-3 border rounded-md"
                    rows={3}
                    value={formData.details}
                    onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                    placeholder="Descripción detallada del producto..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chassis">Chasis</Label>
                    <Input
                      id="chassis"
                      value={formData.chassis}
                      onChange={(e) => setFormData(prev => ({ ...prev, chassis: e.target.value }))}
                      placeholder="Número de chasis"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motor">Motor</Label>
                    <Input
                      id="motor"
                      value={formData.motor}
                      onChange={(e) => setFormData(prev => ({ ...prev, motor: e.target.value }))}
                      placeholder="Número de motor"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <textarea
                    id="observations"
                    className="w-full p-3 border rounded-md"
                    rows={2}
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Crear'} Producto
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
              <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
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
              </Select>
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
          {isLoading ? (
            <div className="text-center py-8">Cargando productos...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stockQuantity)
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          {product.brand && product.model
                            ? `${product.brand} ${product.model}`
                            : product.brand || product.model || '-'
                          }
                        </TableCell>
                        <TableCell>
                          {product.providers?.map(p => p.name).join(', ') || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{product.stockQuantity ?? 0}</span>
                            {(product.stockQuantity ?? 0) <= 5 && (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}