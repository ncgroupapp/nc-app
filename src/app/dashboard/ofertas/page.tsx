'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import {
  Calendar,
  DollarSign,
  Edit,
  Loader2,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  Users
} from "lucide-react";
import { offersService, Offer, CreateOfferDto } from '@/services/offers.service'
import { productsService, Product } from '@/services/products.service'
import { proveedoresService } from '@/services/proveedores.service'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { Proveedor } from '@/types'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'
import { Skeleton } from '@/components/ui/skeleton'
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import { useDebounce } from '@/hooks/use-debounce'
import { FadeIn } from '@/components/common/fade-in'

export default function OfertasPage() {
  const { confirm } = useConfirm()
  const [ofertas, setOfertas] = useState<Offer[]>([])
  const [productos, setProductos] = useState<Product[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [selectedProviders, setSelectedProviders] = useState<number[]>([])

  const [productSearch, setProductSearch] = useState('')
  const debouncedProductSearch = useDebounce(productSearch, 300)

  const [providerSearch, setProviderSearch] = useState('')
  const debouncedProviderSearch = useDebounce(providerSearch, 300)

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

  // State for autocompletes in dialog
  const [dialogProductSearch, setDialogProductSearch] = useState('')
  const debouncedDialogProductSearch = useDebounce(dialogProductSearch, 300)
  const [dialogProviderSearch, setDialogProviderSearch] = useState('')
  const debouncedDialogProviderSearch = useDebounce(dialogProviderSearch, 300)
  
  const [dialogProducts, setDialogProducts] = useState<Product[]>([])
  const [dialogProviders, setDialogProviders] = useState<Proveedor[]>([])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const ofertasRes = await offersService.getAll()
      setOfertas(ofertasRes.data || [])
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

  // Dynamically load products for filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const isSearching = debouncedProductSearch.trim().length > 0;
        const productsRes = await productsService.getAll({ 
          search: isSearching ? debouncedProductSearch : undefined, 
          limit: isSearching ? 20 : 5 
        });
        setProductos(productsRes.data || []);
      } catch (err) {
        console.error("Error loading products:", err);
      }
    };
    fetchProducts();
  }, [debouncedProductSearch]);

  // Dynamically load providers for filters
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const isSearching = debouncedProviderSearch.trim().length > 0;
        const providersRes = await proveedoresService.getAll({ 
          search: isSearching ? debouncedProviderSearch : undefined, 
          limit: isSearching ? 20 : 5 
        });
        setProveedores(providersRes.data || []);
      } catch (err) {
        console.error("Error loading providers:", err);
      }
    };
    fetchProviders();
  }, [debouncedProviderSearch]);

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

  const filteredOfertas = ofertas.filter(oferta => {
    const matchesSearch =
      (oferta.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (oferta.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (oferta.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesProduct = selectedProducts.length === 0 || selectedProducts.includes(oferta.productId)
    const matchesProvider = selectedProviders.length === 0 || selectedProviders.includes(oferta.providerId)

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
    setDialogProductSearch('')
    setDialogProviderSearch('')
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
    setDialogProductSearch(offer.product?.name || '')
    setDialogProviderSearch(offer.provider?.name || '')
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

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
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
      </FadeIn>

      <div className="grid gap-4 md:grid-cols-3">
        <FadeIn delay={100}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ofertas</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-12 pt-1"><Skeleton className="h-full w-full" /></div>
              ) : (
                <div className="text-2xl font-bold">{ofertas.length}</div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={200}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos Ofertados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-12 pt-1"><Skeleton className="h-full w-full" /></div>
              ) : (
                <div className="text-2xl font-bold">
                  {new Set(ofertas.map(o => o.productId)).size}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={300}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-12 pt-1"><Skeleton className="h-full w-full" /></div>
              ) : (
                <div className="text-2xl font-bold">
                  {new Set(ofertas.map(o => o.providerId)).size}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={400}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros y Búsqueda
            </CardTitle>
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
              <div className="w-[250px] max-w-full">
                <MultiSelectSearch
                  options={productos.map((prod) => ({ id: prod.id, label: prod.name }))}
                  selectedValues={selectedProducts}
                  onSelect={(id) => setSelectedProducts(prev => {
                    const numId = Number(id);
                    return prev.includes(numId) ? prev : [...prev, numId];
                  })}
                  onRemove={(id) => setSelectedProducts(prev => prev.filter(p => p !== Number(id)))}
                  placeholder="Filtrar por Producto/s" searchPlaceholder="Buscar producto..." searchValue={productSearch} onSearchValueChange={setProductSearch} shouldFilter={false} single={false}
                />
              </div>
              <div className="w-[250px] max-w-full">
                <MultiSelectSearch
                  options={proveedores.map((prov) => ({ id: prov.id, label: prov.name }))}
                  selectedValues={selectedProviders}
                  onSelect={(id) => setSelectedProviders(prev => {
                    const numId = Number(id);
                    return prev.includes(numId) ? prev : [...prev, numId];
                  })}
                  onRemove={(id) => setSelectedProviders(prev => prev.filter(p => p !== Number(id)))}
                  placeholder="Filtrar por Proveedor/es" searchPlaceholder="Buscar proveedor..." searchValue={providerSearch} onSearchValueChange={setProviderSearch} shouldFilter={false} single={false}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={500}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Listado de Ofertas</span>
              <Badge variant="outline">
                {filteredOfertas.length} {filteredOfertas.length === 1 ? 'oferta' : 'ofertas'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Historial de ofertas recibidas
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[90px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                      <TableCell><div className="flex justify-end space-x-2"><Skeleton className="h-8 w-9" /><Skeleton className="h-8 w-9" /></div></TableCell>
                    </TableRow>
                  ))
                ) : filteredOfertas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay ofertas registradas que coincidan con los filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOfertas.map((oferta) => (
                    <TableRow key={oferta.id} className="hover:bg-muted/30 transition-colors">
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
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </FadeIn>

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
                  <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ej: CD-2024-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Fecha de Entrega *</Label>
                  <DatePicker date={formData.deliveryDate ? new Date(formData.deliveryDate + "T12:00:00") : undefined} setDate={(date) => setFormData(prev => ({ ...prev, deliveryDate: date ? format(date, "yyyy-MM-dd") : "" }))} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Producto *</Label>
                  <MultiSelectSearch options={dialogProducts.map((prod) => ({ id: prod.id, label: prod.name }))} selectedValues={formData.productId ? [formData.productId] : []} onSelect={(id) => setFormData(prev => ({ ...prev, productId: Number(id) }))} onRemove={() => setFormData(prev => ({ ...prev, productId: 0 }))} placeholder="Seleccionar producto" searchPlaceholder="Buscar producto..." searchValue={dialogProductSearch} onSearchValueChange={setDialogProductSearch} shouldFilter={false} single={true} />
                </div>
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <MultiSelectSearch options={dialogProviders.map((prov) => ({ id: prov.id, label: prov.name }))} selectedValues={formData.providerId ? [formData.providerId] : []} onSelect={(id) => setFormData(prev => ({ ...prev, providerId: Number(id) }))} onRemove={() => setFormData(prev => ({ ...prev, providerId: 0 }))} placeholder="Seleccionar proveedor" searchPlaceholder="Buscar proveedor..." searchValue={dialogProviderSearch} onSearchValueChange={setDialogProviderSearch} shouldFilter={false} single={true} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input id="quantity" type="number" min="1" value={isNaN(formData.quantity) ? '' : formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio Unitario *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input id="price" type="number" min="0" step="0.01" value={isNaN(formData.price) ? '' : formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))} className="pl-10" required />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Oferta'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
