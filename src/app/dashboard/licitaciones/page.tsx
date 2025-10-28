'use client'

import { useState } from 'react'
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
  Plus, Search, Edit, Eye, Calendar, Clock, CheckCircle, XCircle,
  AlertCircle, FileText, Calculator, Gavel, Truck
} from 'lucide-react'
import { Licitacion, Cliente, Producto, LicitacionProducto } from '@/types'
import { licitacionSchema } from '@/lib/validations/schema'

// Mock data - en producción vendría de Supabase
const mockClientes: Cliente[] = [
  { id: '1', nombre: 'Municipalidad de Montevideo', identificador: '215967890012', created_at: '', updated_at: '' },
  { id: '2', nombre: 'Empresa XYZ S.A.', identificador: '987654321098', created_at: '', updated_at: '' },
]

const mockProductos: Producto[] = [
  { id: '1', sku: 'PROD-001', nombre: 'Laptop Dell XPS 15', cantidad_stock: 5, proveedor_id: '1', created_at: '', updated_at: '' },
  { id: '2', sku: 'PROD-002', nombre: 'Monitor Samsung 27"', cantidad_stock: 15, proveedor_id: '1', created_at: '', updated_at: '' },
]

const mockLicitaciones: Licitacion[] = [
  {
    id: '1',
    fecha_inicio: '2024-01-15',
    fecha_limite: '2024-01-30',
    cliente_id: '1',
    numero_llamado: 'LIC-2024-001',
    numero_interno: 'INT-2024-001',
    estado: 'En espera',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    cliente: mockClientes[0]
  },
  {
    id: '2',
    fecha_inicio: '2024-01-10',
    fecha_limite: '2024-01-25',
    cliente_id: '2',
    numero_llamado: 'LIC-2024-002',
    numero_interno: 'INT-2024-002',
    estado: 'En espera',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
    cliente: mockClientes[1]
  },
  {
    id: '3',
    fecha_inicio: '2024-01-05',
    fecha_limite: '2024-01-20',
    cliente_id: '1',
    numero_llamado: 'LIC-2024-003',
    numero_interno: 'INT-2024-003',
    estado: 'Adjudicación Total',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
    cliente: mockClientes[0]
  }
]

export default function LicitacionesPage() {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>(mockLicitaciones)
  const [clientes, setClientes] = useState<Cliente[]>(mockClientes)
  const [productos, setProductos] = useState<Producto[]>(mockProductos)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEstado, setSelectedEstado] = useState<string>('all')
  const [selectedCliente, setSelectedCliente] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    fecha_limite: '',
    cliente_id: '',
    numero_llamado: '',
    numero_interno: '',
    productos: [] as { producto_id: string; cantidad_solicitada: number }[]
  })

  const estados = ['En espera', 'Cotización', 'Adjudicada', 'No Adjudicada', 'Adjudicación Parcial', 'Adjudicación Total']
  const clientesUnicos = Array.from(new Set(licitaciones.map(l => l.cliente?.nombre || '')))

  const filteredLicitaciones = licitaciones.filter(licitacion => {
    const matchesSearch = licitacion.numero_llamado.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         licitacion.numero_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         licitacion.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = selectedEstado === 'all' || licitacion.estado === selectedEstado
    const matchesCliente = selectedCliente === 'all' || licitacion.cliente?.nombre === selectedCliente
    return matchesSearch && matchesEstado && matchesCliente
  })

  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case 'En espera':
        return { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'En espera' }
      case 'Cotización':
        return { icon: Calculator, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Cotización' }
      case 'Adjudicada':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Adjudicada' }
      case 'No Adjudicada':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'No Adjudicada' }
      case 'Adjudicación Parcial':
        return { icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Adjudicación Parcial' }
      case 'Adjudicación Total':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Adjudicación Total' }
      default:
        return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100', label: estado }
    }
  }

  const isVencida = (fechaLimite: string) => {
    return new Date(fechaLimite) < new Date()
  }

  const handleAddProduct = () => {
    setFormData(prev => ({
      ...prev,
      productos: [...prev.productos, { producto_id: '', cantidad_solicitada: 1 }]
    }))
  }

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.filter((_, i) => i !== index)
    }))
  }

  const handleProductChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      )
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newLicitacion: Licitacion = {
      id: Date.now().toString(),
      ...formData,
      productos: formData.productos.map((p, index) => ({
        id: `${Date.now()}-${index}`,
        licitacion_id: Date.now().toString(),
        producto_id: p.producto_id,
        cantidad_solicitada: p.cantidad_solicitada,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })),
      estado: 'En espera',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cliente: clientes.find(c => c.id === formData.cliente_id)
    }

    setLicitaciones(prev => [...prev, newLicitacion])

    // Reset form
    setFormData({
      fecha_inicio: '',
      fecha_limite: '',
      cliente_id: '',
      numero_llamado: '',
      numero_interno: '',
      productos: []
    })
    setIsCreateDialogOpen(false)
  }

  const getStatsByEstado = () => {
    return estados.map(estado => ({
      estado,
      count: licitaciones.filter(l => l.estado === estado).length
    }))
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
              <Tabs defaultValue="datos" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="datos">Datos Generales</TabsTrigger>
                  <TabsTrigger value="productos">Productos Solicitados</TabsTrigger>
                </TabsList>

                <TabsContent value="datos" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numero_llamado">Número de Llamado *</Label>
                      <Input
                        id="numero_llamado"
                        value={formData.numero_llamado}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero_llamado: e.target.value }))}
                        placeholder="Ej: LIC-2024-001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero_interno">Número Interno *</Label>
                      <Input
                        id="numero_interno"
                        value={formData.numero_interno}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero_interno: e.target.value }))}
                        placeholder="Ej: INT-2024-001"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cliente_id">Cliente *</Label>
                    <Select
                      value={formData.cliente_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                      <Input
                        id="fecha_inicio"
                        type="date"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha_limite">Fecha Límite *</Label>
                      <Input
                        id="fecha_limite"
                        type="date"
                        value={formData.fecha_limite}
                        onChange={(e) => setFormData(prev => ({ ...prev, fecha_limite: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="productos" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Productos Solicitados</h3>
                    <Button type="button" variant="outline" onClick={handleAddProduct}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Producto
                    </Button>
                  </div>

                  {formData.productos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay productos agregados. Haga clic en &quot;Agregar Producto&quot; para comenzar.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.productos.map((product, index) => (
                        <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                          <div className="flex-1">
                            <Label>Producto *</Label>
                            <Select
                              value={product.producto_id}
                              onValueChange={(value) => handleProductChange(index, 'producto_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar producto" />
                              </SelectTrigger>
                              <SelectContent>
                                {productos.map((producto) => (
                                  <SelectItem key={producto.id} value={producto.id}>
                                    {producto.nombre} (Stock: {producto.cantidad_stock})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32">
                            <Label>Cantidad *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={product.cantidad_solicitada}
                              onChange={(e) => handleProductChange(index, 'cantidad_solicitada', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveProduct(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={formData.productos.length === 0}>
                  Crear Licitación
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        {getStatsByEstado().map(({ estado, count }) => {
          const estadoInfo = getEstadoInfo(estado)
          return (
            <Card key={estado}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{estado}</CardTitle>
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
                  {estados.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
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
                  {clientesUnicos.map((cliente) => (
                    <SelectItem key={cliente} value={cliente}>
                      {cliente}
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
            <Badge variant="outline">{filteredLicitaciones.length} licitaciones</Badge>
          </CardTitle>
          <CardDescription>
            Gestione todas las licitaciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {filteredLicitaciones.map((licitacion) => {
                const estadoInfo = getEstadoInfo(licitacion.estado)
                const vencida = isVencida(licitacion.fecha_limite) && licitacion.estado === 'En espera'

                return (
                  <TableRow key={licitacion.id} className={vencida ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{licitacion.numero_llamado}</div>
                        <div className="text-sm text-gray-500">{licitacion.numero_interno}</div>
                      </div>
                    </TableCell>
                    <TableCell>{licitacion.cliente?.nombre}</TableCell>
                    <TableCell>{licitacion.fecha_inicio}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{licitacion.fecha_limite}</span>
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
        </CardContent>
      </Card>
    </div>
  )
}