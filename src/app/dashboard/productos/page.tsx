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
import { Producto, Proveedor } from '@/types'
import { productoSchema } from '@/lib/validations/schema'

// Mock data - en producción vendría de Supabase
const mockProveedores: Proveedor[] = [
  { id: '1', nombre: 'Proveedor A', pais: 'Uruguay', contacto: 'Juan Pérez', email: 'juan@proveedora.com', telefono: '099123456', created_at: '', updated_at: '' },
  { id: '2', nombre: 'Proveedor B', pais: 'Argentina', contacto: 'María García', email: 'maria@proveedorb.com', telefono: '011987654', created_at: '', updated_at: '' },
]

const mockProductos: Producto[] = [
  {
    id: '1',
    sku: 'PROD-001',
    nombre: 'Laptop Dell XPS 15',
    proveedor_id: '1',
    marca: 'Dell',
    modelo: 'XPS 15',
    cantidad_stock: 5,
    detalles: 'Laptop de alto rendimiento',
    created_at: '',
    updated_at: '',
    proveedor: mockProveedores[0]
  },
  {
    id: '2',
    sku: 'PROD-002',
    nombre: 'Monitor Samsung 27"',
    proveedor_id: '2',
    marca: 'Samsung',
    modelo: 'S27R350',
    cantidad_stock: 15,
    detalles: 'Monitor LED 27 pulgadas',
    created_at: '',
    updated_at: '',
    proveedor: mockProveedores[1]
  },
  {
    id: '3',
    sku: 'PROD-003',
    nombre: 'Teclado Mecánico Logitech',
    proveedor_id: '1',
    marca: 'Logitech',
    modelo: 'MX Keys',
    cantidad_stock: 2,
    detalles: 'Teclado mecánico inalámbrico',
    created_at: '',
    updated_at: '',
    proveedor: mockProveedores[0]
  }
]

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>(mockProductos)
  const [proveedores, setProveedores] = useState<Proveedor[]>(mockProveedores)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProveedor, setSelectedProveedor] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    proveedor_id: '',
    marca: '',
    modelo: '',
    cantidad_stock: 0,
    detalles: '',
    observaciones: '',
    chasis: '',
    motor: ''
  })

  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProveedor = selectedProveedor === 'all' || producto.proveedor_id === selectedProveedor
    return matchesSearch && matchesProveedor
  })

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Agotado', variant: 'destructive' as const }
    if (stock <= 5) return { label: 'Bajo Stock', variant: 'secondary' as const }
    return { label: 'Disponible', variant: 'default' as const }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingProduct) {
      // Editar producto existente
      setProductos(prev => prev.map(p =>
        p.id === editingProduct.id
          ? {
              ...p,
              ...formData,
              updated_at: new Date().toISOString(),
              proveedor: proveedores.find(pr => pr.id === formData.proveedor_id)
            }
          : p
      ))
    } else {
      // Crear nuevo producto
      const newProducto: Producto = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        proveedor: proveedores.find(pr => pr.id === formData.proveedor_id)
      }
      setProductos(prev => [...prev, newProducto])
    }

    // Reset form
    setFormData({
      sku: '',
      nombre: '',
      proveedor_id: '',
      marca: '',
      modelo: '',
      cantidad_stock: 0,
      detalles: '',
      observaciones: '',
      chasis: '',
      motor: ''
    })
    setEditingProduct(null)
    setIsCreateDialogOpen(false)
  }

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto)
    setFormData({
      sku: producto.sku,
      nombre: producto.nombre,
      proveedor_id: producto.proveedor_id,
      marca: producto.marca || '',
      modelo: producto.modelo || '',
      cantidad_stock: producto.cantidad_stock,
      detalles: producto.detalles || '',
      observaciones: producto.observaciones || '',
      chasis: producto.chasis || '',
      motor: producto.motor || ''
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este producto?')) {
      setProductos(prev => prev.filter(p => p.id !== id))
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)}>
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
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Ej: PROD-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proveedor_id">Proveedor *</Label>
                    <Select
                      value={formData.proveedor_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, proveedor_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {proveedores.map((proveedor) => (
                          <SelectItem key={proveedor.id} value={proveedor.id}>
                            {proveedor.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Producto *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Laptop Dell XPS 15"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca</Label>
                    <Input
                      id="marca"
                      value={formData.marca}
                      onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                      placeholder="Ej: Dell"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input
                      id="modelo"
                      value={formData.modelo}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                      placeholder="Ej: XPS 15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantidad_stock">Cantidad en Stock *</Label>
                  <Input
                    id="cantidad_stock"
                    type="number"
                    min="0"
                    value={formData.cantidad_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, cantidad_stock: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detalles">Detalles</Label>
                  <textarea
                    id="detalles"
                    className="w-full p-3 border rounded-md"
                    rows={3}
                    value={formData.detalles}
                    onChange={(e) => setFormData(prev => ({ ...prev, detalles: e.target.value }))}
                    placeholder="Descripción detallada del producto..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chasis">Chasis</Label>
                    <Input
                      id="chasis"
                      value={formData.chasis}
                      onChange={(e) => setFormData(prev => ({ ...prev, chasis: e.target.value }))}
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
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <textarea
                    id="observaciones"
                    className="w-full p-3 border rounded-md"
                    rows={2}
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Actualizar' : 'Crear'} Producto
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
                  placeholder="Buscar por nombre, SKU o modelo..."
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
                      {proveedor.nombre}
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
            <Badge variant="outline">{filteredProductos.length} productos</Badge>
          </CardTitle>
          <CardDescription>
            Gestione el inventario de productos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductos.map((producto) => {
                const stockStatus = getStockStatus(producto.cantidad_stock)
                return (
                  <TableRow key={producto.id}>
                    <TableCell className="font-medium">{producto.sku}</TableCell>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>
                      {producto.marca && producto.modelo
                        ? `${producto.marca} ${producto.modelo}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{producto.proveedor?.nombre}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{producto.cantidad_stock}</span>
                        {producto.cantidad_stock <= 5 && (
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
                          onClick={() => handleEdit(producto)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(producto.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}