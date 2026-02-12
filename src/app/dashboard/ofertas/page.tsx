'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Plus, Search, Edit, Trash, Tag, Loader2, Calendar, Users, DollarSign, Package
} from 'lucide-react'
import { offersService, Offer, CreateOfferDto } from '@/services/offers.service'
import { productsService, Product } from '@/services/products.service'
import { proveedoresService } from '@/services/proveedores.service'
import { Proveedor } from '@/types'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'

export default function OfertasPage() {
  const { confirm } = useConfirm()
  const [ofertas, setOfertas] = useState<Offer[]>([])
  const [productos, setProductos] = useState<Product[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<CreateOfferDto>({
    name: '',
    productId: 0,
    providerId: 0,
    price: 0,
    deliveryDate: '',
    quantity: 1
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      const [ofertasRes, productosRes, proveedoresRes] = await Promise.all([
        offersService.getAll(),
        productsService.getAll(),
        proveedoresService.getAll()
      ])
      
      setOfertas(ofertasRes.data || [])
      setProductos(productosRes.data || [])
      setProveedores(proveedoresRes.data || [])
    } catch (err) {
      console.error('Error loading data:', err)
      toast.error("Error", {
        description: "Error al cargar los datos. Por favor, intente nuevamente."
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredOfertas = ofertas.filter(oferta => {
    const matchesSearch = 
      (oferta.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (oferta.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (oferta.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
    const matchesProduct = selectedProduct === 'all' || oferta.productId.toString() === selectedProduct
    const matchesProvider = selectedProvider === 'all' || oferta.providerId.toString() === selectedProvider
    
    return matchesSearch && matchesProduct && matchesProvider
  })

  const handleOpenCreate = () => {
    setEditingOffer(null)
    setFormData({
      name: '',
      productId: 0,
      providerId: 0,
      price: 0,
      deliveryDate: '',
      quantity: 1
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (offer: Offer) => {
    setEditingOffer(offer)
    setFormData({
      name: offer.name || '',
      productId: offer.productId,
      providerId: offer.providerId,
      price: offer.price,
      deliveryDate: offer.deliveryDate,
      quantity: offer.quantity
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!await confirm({
      title: 'Eliminar Oferta',
      message: '¿Está seguro de eliminar esta oferta?',
      variant: 'destructive'
    })) return

    try {
      await offersService.delete(id)
      toast.success("Éxito", {
        description: "Oferta eliminada correctamente",
      })
      loadData()
    } catch (err) {
      console.error('Error deleting offer:', err)
      toast.error("Error", {
        description: "Error al eliminar la oferta",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.productId || !formData.providerId || !formData.price || !formData.deliveryDate || !formData.quantity) {
      toast.error("Error", {
        description: "Por favor complete todos los campos obligatorios",
      })
      return
    }

    try {
      setSubmitting(true)

      if (editingOffer) {
        await offersService.update(editingOffer.id, formData)
        toast.success("Éxito", {
          description: "Oferta actualizada correctamente",
        })
      } else {
        await offersService.create(formData)
        toast.success("Éxito", {
          description: "Oferta creada correctamente",
        })
      }
      
      setIsDialogOpen(false)
      loadData()
    } catch (err) {
      console.error('Error saving offer:', err)
      toast.error("Error", {
        description: "Error al guardar la oferta. Verifique los datos.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando ofertas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Ofertas</h1>
          <p className="text-muted-foreground">
            Registro y gestión de ofertas de proveedores (Compra Directa)
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Oferta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ofertas</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ofertas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Ofertados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(ofertas.map(o => o.productId)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(ofertas.map(o => o.providerId)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, producto o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-[200px]">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Producto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  {productos.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id.toString()}>
                      {prod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {proveedores.map((prov) => (
                    <SelectItem key={prov.id} value={prov.id.toString()}>
                      {prov.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Ofertas</CardTitle>
          <CardDescription>
            Historial de ofertas recibidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOfertas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay ofertas registradas que coincidan con los filtros.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre CD</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOfertas.map((oferta) => (
                  <TableRow key={oferta.id}>
                    <TableCell className="font-medium">{oferta.name || '-'}</TableCell>
                    <TableCell>{oferta.product?.name}</TableCell>
                    <TableCell>{oferta.provider?.name}</TableCell>
                    <TableCell>{oferta.quantity}</TableCell>
                    <TableCell>${Number(oferta.price).toFixed(2)}</TableCell>
                    <TableCell className="font-bold">
                      ${(Number(oferta.price) * Number(oferta.quantity)).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-3 w-3" />
                        {oferta.deliveryDate ? new Date(oferta.deliveryDate).toLocaleDateString() : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenEdit(oferta)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(oferta.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingOffer ? 'Editar Oferta' : 'Nueva Oferta'}</DialogTitle>
            <DialogDescription>
              Complete los detalles de la oferta. Todos los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre CD</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: CD-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Fecha de Entrega *</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={formData.deliveryDate ? new Date(formData.deliveryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productId">Producto *</Label>
                  <Select
                    value={formData.productId.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, productId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((prod) => (
                        <SelectItem key={prod.id} value={prod.id.toString()}>
                          {prod.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerId">Proveedor *</Label>
                  <Select
                    value={formData.providerId.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, providerId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedores.map((prov) => (
                        <SelectItem key={prov.id} value={prov.id.toString()}>
                          {prov.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={isNaN(formData.quantity) ? '' : formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio Unitario *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={isNaN(formData.price) ? '' : formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Oferta'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
