'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { clientesService } from '@/services/clientes.service'
import { CreateLicitationDto, licitacionesService, Licitation, LicitationStatus } from '@/services/licitaciones.service'
import { Product, productsService } from '@/services/products.service'
import { Cliente } from '@/types'
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronsUpDown,
  Clock,
  Edit, Eye,
  FileText, Loader2,
  Plus, Search,
  XCircle
} from 'lucide-react'
import { showSnackbar } from '@/components/ui/snackbar'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk'
import { cn } from '@/lib/utils'

// Map backend status to Spanish display labels
const statusLabels: Record<LicitationStatus, string> = {
  [LicitationStatus.PENDING]: 'En espera',
  [LicitationStatus.PARTIAL_ADJUDICATION]: 'Adjudicación Parcial',
  [LicitationStatus.NOT_ADJUDICATED]: 'No Adjudicada',
  [LicitationStatus.TOTAL_ADJUDICATION]: 'Adjudicación Total',
  [LicitationStatus.QUOTED]: ''
}

// Interface para productos con cantidad
interface ProductWithQuantity {
  product: Product;
  quantity: number;
}

// Helper para formatear fecha a DD/MM/YYYY
const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default function LicitacionesPage() {
  const [licitaciones, setLicitaciones] = useState<Licitation[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEstado, setSelectedEstado] = useState<string>('all')
  const [selectedCliente, setSelectedCliente] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // Autocompletar cliente en formulario
  
  // Autocompletar cliente en formulario
  const [selectedClientName, setSelectedClientName] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    startDate: '',
    deadlineDate: '',
    clientId: '',
    callNumber: '',
    internalNumber: '',
    productsWithQuantity: [] as ProductWithQuantity[]
  })


  const estados = Object.values(LicitationStatus)

  // Función para cargar solo licitaciones con los filtros actuales
  const fetchLicitaciones = async (page: number, search?: string, status?: string, clientId?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const filters = {
        page,
        search: search || undefined,
        status: status !== 'all' ? status as LicitationStatus : undefined,
        clientId: clientId !== 'all' && clientId ? parseInt(clientId) : undefined,
      }
      
      const licitacionesRes = await licitacionesService.getAll(filters)
      
      setLicitaciones(licitacionesRes.data || [])
      setTotalPages(licitacionesRes.meta?.lastPage || 1)
      setTotalItems(licitacionesRes.meta?.total || 0)
    } catch (err) {
      console.error('Error loading licitaciones:', err)
      setError('Error al cargar los datos. Por favor, intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  // Carga inicial de datos estáticos (clientes y productos) - solo una vez
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [clientesRes, productosRes] = await Promise.all([
          clientesService.getAll(),
          productsService.getAll()
        ])
        setClientes(clientesRes.data || [])
        setSearchResults(productosRes.data || [])
      } catch (err) {
        console.error('Error loading initial data:', err)
      }
    }
    loadInitialData()
    fetchLicitaciones(1, '', 'all', 'all').finally(() => setInitialLoading(false))
  }, [])

  // Debounce para búsqueda de texto
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchLicitaciones(1, searchTerm, selectedEstado, selectedCliente)
    }, 300)
    return () => clearTimeout(timeoutId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  // Cambio de filtros de select (sin debounce)
  const handleEstadoChange = (value: string) => {
    setSelectedEstado(value)
    setCurrentPage(1)
    fetchLicitaciones(1, searchTerm, value, selectedCliente)
  }

  const handleClienteChange = (value: string) => {
    setSelectedCliente(value)
    setCurrentPage(1)
    fetchLicitaciones(1, searchTerm, selectedEstado, value)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchLicitaciones(newPage, searchTerm, selectedEstado, selectedCliente)
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsService.getAll({ search: productSearch })
        setSearchResults(response.data || [])
      } catch (error) {
        console.error('Error searching products:', error)
      }
    }

    const timeoutId = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timeoutId)
  }, [productSearch])



  const getEstadoInfo = (status: LicitationStatus) => {
    switch (status) {
      case LicitationStatus.PENDING:
        return { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'En espera' }
      case LicitationStatus.PARTIAL_ADJUDICATION:
        return { icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Adjudicación Parcial' }
      case LicitationStatus.NOT_ADJUDICATED:
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'No Adjudicada' }
      case LicitationStatus.TOTAL_ADJUDICATION:
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Adjudicación Total' }
      default:
        return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100', label: status }
    }
  }

  const isVencida = (deadlineDate: string) => {
    return new Date(deadlineDate) < new Date()
  }

  const handleAddProduct = (product: Product) => {
    const exists = formData.productsWithQuantity.some(p => p.product.id === product.id)
    if (!exists) {
      setFormData(prev => ({
        ...prev,
        productsWithQuantity: [...prev.productsWithQuantity, { product, quantity: 1 }]
      }))
    }
  }

  const handleRemoveProduct = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      productsWithQuantity: prev.productsWithQuantity.filter(p => p.product.id !== productId)
    }))
  }

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      productsWithQuantity: prev.productsWithQuantity.map(p =>
        p.product.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
      )
    }))
  }

  // Validación de fecha en tiempo real
  const handleStartDateChange = (value: string) => {
    setFormData(prev => ({ ...prev, startDate: value }))
    if (formData.deadlineDate && new Date(formData.deadlineDate) < new Date(value)) {
      setDateError('La fecha límite no puede ser menor que la fecha de inicio')
    } else {
      setDateError(null)
    }
  }

  const handleDeadlineDateChange = (value: string) => {
    setFormData(prev => ({ ...prev, deadlineDate: value }))
    if (formData.startDate && new Date(value) < new Date(formData.startDate)) {
      setDateError('La fecha límite no puede ser menor que la fecha de inicio')
    } else {
      setDateError(null)
    }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientId || !formData.callNumber || !formData.startDate || !formData.deadlineDate) {
      showSnackbar('Por favor complete todos los campos requeridos', 'error')
      return
    }

    // Validación de fechas
    if (new Date(formData.deadlineDate) < new Date(formData.startDate)) {
      showSnackbar('La fecha límite no puede ser menor que la fecha de inicio', 'error')
      return
    }

    if (formData.productsWithQuantity.length === 0) {
      showSnackbar('Debe agregar al menos un producto', 'error')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const createData: CreateLicitationDto = {
        startDate: formData.startDate,
        deadlineDate: formData.deadlineDate,
        clientId: parseInt(formData.clientId),
        callNumber: formData.callNumber,
        internalNumber: formData.internalNumber,
        products: formData.productsWithQuantity.map(p => ({
          productId: p.product.id,
          quantity: p.quantity
        }))
      }

      await licitacionesService.create(createData)
      
      // Reset form
      setFormData({
        startDate: '',
        deadlineDate: '',
        clientId: '',
        callNumber: '',
        internalNumber: '',
        productsWithQuantity: []
      })
      setSelectedClientName('')
      setIsCreateDialogOpen(false)
      
      // Reload data
      await fetchLicitaciones(1, searchTerm, selectedEstado, selectedCliente)
      
      showSnackbar('Licitación creada correctamente', 'success')
    } catch (err) {
      console.error('Error creating licitation:', err)
      showSnackbar('Error al crear la licitación. Por favor, intente nuevamente.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatsByEstado = () => {
    return estados.map(status => ({
      status,
      label: statusLabels[status],
      count: licitaciones.filter(l => l.status === status).length
    }))
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando licitaciones...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Licitaciones</h1>
          <p className="text-muted-foreground">
            Gestión del ciclo completo de licitaciones
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Licitación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Licitación</DialogTitle>
              <DialogDescription>
                Complete los datos para crear una nueva licitación.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setError(null)}
                    className="h-6 w-6 p-0 hover:bg-destructive/20"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Tabs defaultValue="datos" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="datos">Datos Generales</TabsTrigger>
                  <TabsTrigger value="productos">Productos Solicitados</TabsTrigger>
                </TabsList>

                <TabsContent value="datos" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="callNumber">Número de Llamado *</Label>
                      <Input
                        id="callNumber"
                        value={formData.callNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, callNumber: e.target.value }))}
                        placeholder="Ej: LIC-2024-001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="internalNumber">Número Interno *</Label>
                      <Input
                        id="internalNumber"
                        value={formData.internalNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, internalNumber: e.target.value }))}
                        placeholder="Ej: INT-2024-001"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientId">Cliente *</Label>
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Cliente *</Label>
                    <MultiSelectSearch
                      options={clientes.map(c => ({
                        id: c.id,
                        label: `${c.name} (${c.identifier})`
                      }))}
                      selectedValues={formData.clientId ? [parseInt(formData.clientId)] : []}
                      onSelect={(id) => {
                        const client = clientes.find(c => c.id === id)
                        if (client) {
                          setFormData(prev => ({ ...prev, clientId: client.id.toString() }))
                          setSelectedClientName(client.name)
                        }
                      }}
                      onRemove={() => {
                        setFormData(prev => ({ ...prev, clientId: '' }))
                        setSelectedClientName('')
                      }}
                      placeholder={selectedClientName || "Seleccionar cliente..."}
                      searchPlaceholder="Buscar cliente..."
                      emptyMessage="No se encontraron clientes."
                      hideTags={true}
                      shouldFilter={true}
                    />
                  </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Fecha de Inicio *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        required
                      />
                      {formData.startDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDateDisplay(formData.startDate)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadlineDate">Fecha Límite *</Label>
                      <Input
                        id="deadlineDate"
                        type="date"
                        value={formData.deadlineDate}
                        onChange={(e) => handleDeadlineDateChange(e.target.value)}
                        required
                        min={formData.startDate}
                        className={dateError ? 'border-red-500' : ''}
                      />
                      {formData.deadlineDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDateDisplay(formData.deadlineDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  {dateError && (
                    <p className="text-sm text-red-500 mt-2">{dateError}</p>
                  )}
                </TabsContent>

                <TabsContent value="productos" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Agregar Producto</Label>
                    <MultiSelectSearch
                      options={searchResults.map(p => ({ 
                        id: p.id, 
                        label: `${p.name} (Stock: ${p.stockQuantity || 0})` 
                      }))}
                      selectedValues={formData.productsWithQuantity.map(p => p.product.id)}
                      onSelect={(id) => {
                        const product = searchResults.find(p => p.id === id)
                        if (product) handleAddProduct(product)
                      }}
                      onRemove={(id) => handleRemoveProduct(Number(id))}
                      placeholder="Seleccionar producto para agregar..."
                      searchPlaceholder="Buscar producto..."
                      emptyMessage="No se encontraron productos."
                      searchValue={productSearch}
                      onSearchValueChange={setProductSearch}
                      shouldFilter={false}
                      hideTags={true}
                    />
                  </div>

                  {formData.productsWithQuantity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay productos agregados. Busque y seleccione productos.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Productos Seleccionados</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {formData.productsWithQuantity.map(({ product, quantity }) => (
                          <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg gap-3">
                            <div className="flex-1">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                (Stock: {product.stockQuantity || 0})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`qty-${product.id}`} className="text-sm whitespace-nowrap">Cantidad:</Label>
                              <Input
                                id={`qty-${product.id}`}
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => handleUpdateQuantity(product.id, parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting || formData.productsWithQuantity.length === 0 || !!dateError}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Licitación'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {getStatsByEstado().map(({ status, label, count }) => {
          const estadoInfo = getEstadoInfo(status)
          return (
            <Card key={status}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <estadoInfo.icon className={`h-4 w-4 ${estadoInfo.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          )
        })}
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
                  placeholder="Buscar por número de llamado o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedEstado} onValueChange={handleEstadoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {estados.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={selectedCliente} onValueChange={handleClienteChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licitaciones Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Listado de Licitaciones</span>
            <Badge variant="outline">{totalItems} licitaciones</Badge>
          </CardTitle>
          <CardDescription>
            Gestione todas las licitaciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando...</span>
            </div>
          ) : licitaciones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay licitaciones que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Límite</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licitaciones.map((licitacion) => {
                  const estadoInfo = getEstadoInfo(licitacion.status)
                  const vencida = isVencida(licitacion.deadlineDate) && licitacion.status === LicitationStatus.PENDING

                  return (
                    <TableRow key={licitacion.id} className={vencida ? 'bg-red-50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{licitacion.callNumber}</div>
                          <div className="text-sm text-gray-500">{licitacion.internalNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>{licitacion.client?.name}</TableCell>
                      <TableCell>{new Date(licitacion.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{new Date(licitacion.deadlineDate).toLocaleDateString()}</span>
                          {vencida && (
                            <Badge variant="destructive" className="text-xs">
                              Vencida
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${estadoInfo.bgColor} ${estadoInfo.color} border-none`}>
                          <estadoInfo.icon className="mr-1 h-3 w-3" />
                          {estadoInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/dashboard/licitaciones/${licitacion.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            
            {/* Paginación */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Mostrando {licitaciones.length} de {totalItems} resultados
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Anterior
                </Button>
                <span className="px-3 py-2 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}