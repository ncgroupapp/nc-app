'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Plus, Search, Edit, Eye, Clock, CheckCircle, XCircle,
  AlertCircle, FileText, Loader2, Check, ChevronsUpDown
} from 'lucide-react'
import { licitacionesService, Licitation, LicitationStatus, CreateLicitationDto } from '@/services/licitaciones.service'
import { clientesService } from '@/services/clientes.service'
import { productsService, Product } from '@/services/products.service'
import { Cliente } from '@/types'

// Map backend status to Spanish display labels
const statusLabels: Record<LicitationStatus, string> = {
  [LicitationStatus.PENDING]: 'En espera',
  [LicitationStatus.PARTIAL_ADJUDICATION]: 'Adjudicación Parcial',
  [LicitationStatus.NOT_ADJUDICATED]: 'No Adjudicada',
  [LicitationStatus.TOTAL_ADJUDICATION]: 'Adjudicación Total',
}

export default function LicitacionesPage() {
  const [licitaciones, setLicitaciones] = useState<Licitation[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [openCombobox, setOpenCombobox] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [loading, setLoading] = useState(true)
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
  const [openClientCombobox, setOpenClientCombobox] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [filteredClients, setFilteredClients] = useState<Cliente[]>([])
  const [selectedClientName, setSelectedClientName] = useState('')
  
  const [formData, setFormData] = useState({
    startDate: '',
    deadlineDate: '',
    clientId: '',
    callNumber: '',
    internalNumber: '',
    productIds: [] as number[]
  })

  const estados = Object.values(LicitationStatus)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Preparar filtros para el backend
      const filters = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: selectedEstado !== 'all' ? selectedEstado as LicitationStatus : undefined,
        clientId: selectedCliente !== 'all' ? parseInt(selectedCliente) : undefined,
      }
      
      const [licitacionesRes, clientesRes, productosRes] = await Promise.all([
        licitacionesService.getAll(filters),
        clientesService.getAll(),
        productsService.getAll()
      ])
      
      setLicitaciones(licitacionesRes.data || [])
      setTotalPages(licitacionesRes.meta?.lastPage || 1)
      setTotalItems(licitacionesRes.meta?.total || 0)
      setClientes(clientesRes.data || [])
      setFilteredClients(clientesRes.data || [])
      setSearchResults(productosRes.data || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Error al cargar los datos. Por favor, intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, selectedEstado, selectedCliente])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  // Filtrar clientes para autocompletar en formulario
  useEffect(() => {
    if (clientSearch) {
      const filtered = clientes.filter(c => 
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.identifier.toLowerCase().includes(clientSearch.toLowerCase())
      )
      setFilteredClients(filtered)
    } else {
      setFilteredClients(clientes)
    }
  }, [clientSearch, clientes])

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedEstado, selectedCliente])

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
    if (!formData.productIds.includes(product.id)) {
      setFormData(prev => ({
        ...prev,
        productIds: [...prev.productIds, product.id]
      }))
      setSelectedProducts(prev => [...prev, product])
    }
    setOpenCombobox(false)
  }

  const handleRemoveProduct = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.filter(id => id !== productId)
    }))
    setSelectedProducts(prev => prev.filter(p => p.id !== productId))
  }

  const handleSelectClient = (cliente: Cliente) => {
    setFormData(prev => ({ ...prev, clientId: cliente.id.toString() }))
    setSelectedClientName(cliente.name)
    setOpenClientCombobox(false)
    setClientSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientId || !formData.callNumber || !formData.startDate || !formData.deadlineDate) {
      setError('Por favor complete todos los campos requeridos')
      return
    }

    // Validación de fechas
    if (new Date(formData.deadlineDate) < new Date(formData.startDate)) {
      setError('La fecha límite no puede ser menor que la fecha de inicio')
      return
    }

    if (formData.productIds.length === 0) {
      setError('Debe agregar al menos un producto')
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
        productIds: formData.productIds
      }

      await licitacionesService.create(createData)
      
      // Reset form
      setFormData({
        startDate: '',
        deadlineDate: '',
        clientId: '',
        callNumber: '',
        internalNumber: '',
        productIds: []
      })
      setSelectedProducts([])
      setSelectedClientName('')
      setIsCreateDialogOpen(false)
      
      // Reload data
      await loadData()
    } catch (err) {
      console.error('Error creating licitation:', err)
      setError('Error al crear la licitación. Por favor, intente nuevamente.')
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

  if (loading) {
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
                    <Popover open={openClientCombobox} onOpenChange={setOpenClientCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openClientCombobox}
                          className="w-full justify-between"
                        >
                          {selectedClientName || "Seleccionar cliente..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Buscar cliente..." 
                            value={clientSearch}
                            onValueChange={setClientSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                            <CommandGroup>
                              {filteredClients.map((cliente) => (
                                <CommandItem
                                  key={cliente.id}
                                  value={cliente.name}
                                  onSelect={() => handleSelectClient(cliente)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.clientId === cliente.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div>
                                    <span className="font-medium">{cliente.name}</span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      ({cliente.identifier})
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Fecha de Inicio *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadlineDate">Fecha Límite *</Label>
                      <Input
                        id="deadlineDate"
                        type="date"
                        value={formData.deadlineDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, deadlineDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="productos" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Agregar Producto</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="w-full justify-between"
                        >
                          Seleccionar producto para agregar...
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Buscar producto..." 
                            value={productSearch}
                            onValueChange={setProductSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No se encontraron productos.</CommandEmpty>
                            <CommandGroup>
                              {searchResults.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.name}
                                  onSelect={() => handleAddProduct(product)}
                                  disabled={formData.productIds.includes(product.id)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.productIds.includes(product.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {product.name} (Stock: {product.stockQuantity || 0})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {formData.productIds.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay productos agregados. Busque y seleccione productos.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Productos Seleccionados</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedProducts.map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <span className="font-medium">{product.name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                (Stock: {product.stockQuantity || 0})
                              </span>
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
                <Button type="submit" disabled={submitting || formData.productIds.length === 0}>
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
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
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
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
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
          {licitaciones.length === 0 ? (
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
                  onClick={() => setCurrentPage(p => p - 1)}
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
                  onClick={() => setCurrentPage(p => p + 1)}
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