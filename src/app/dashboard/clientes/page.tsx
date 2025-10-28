'use client'

import { useState } from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Building2, Phone, Mail, FileText } from 'lucide-react'
import { Cliente } from '@/types'
import { clienteSchema } from '@/lib/validations/schema'

// Mock data - en producción vendría de Supabase
const mockClientes: Cliente[] = [
  {
    id: '1',
    nombre: 'Municipalidad de Montevideo',
    identificador: '215967890012',
    email: 'compras@imm.gub.uy',
    telefono: '19502020',
    direccion: 'Av. 18 de Julio 1360, Montevideo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    nombre: 'Empresa XYZ S.A.',
    identificador: '987654321098',
    email: 'licitaciones@empresa.com',
    telefono: '24011234',
    direccion: 'Ruta 8 km 17.500, Montevideo',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    nombre: 'Ministerio de Educación y Cultura',
    identificador: '345678901234',
    email: 'compras@mec.gub.uy',
    telefono: '24002345',
    direccion: 'Reconquista 535, Montevideo',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  },
  {
    id: '4',
    nombre: 'Hospital Maciel',
    identificador: '456789012345',
    email: 'compras@hmaciel.gub.uy',
    telefono: '29246161',
    direccion: '25 de Mayo 275, Montevideo',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z'
  }
]

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(mockClientes)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    identificador: '',
    email: '',
    telefono: '',
    direccion: ''
  })

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingCliente) {
      // Editar cliente existente
      setClientes(prev => prev.map(c =>
        c.id === editingCliente.id
          ? {
              ...c,
              ...formData,
              updated_at: new Date().toISOString()
            }
          : c
      ))
    } else {
      // Crear nuevo cliente
      const newCliente: Cliente = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setClientes(prev => [...prev, newCliente])
    }

    // Reset form
    setFormData({
      nombre: '',
      identificador: '',
      email: '',
      telefono: '',
      direccion: ''
    })
    setEditingCliente(null)
    setIsCreateDialogOpen(false)
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nombre: cliente.nombre,
      identificador: cliente.identificador,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este cliente?')) {
      setClientes(prev => prev.filter(c => c.id !== id))
    }
  }

  const hasAssociatedLicitaciones = (clienteId: string) => {
    // En producción, verificar si hay licitaciones asociadas
    return false
  }

  const getClienteType = (identificador: string) => {
    // Lógica para determinar si es empresa o gobierno basado en el identificador
    if (identificador.includes('gub.uy') || identificador.length < 12) {
      return { type: 'Gobierno', variant: 'default' as const }
    }
    return { type: 'Empresa', variant: 'secondary' as const }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestión de clientes del sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCliente(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
              </DialogTitle>
              <DialogDescription>
                Complete los datos del cliente para {editingCliente ? 'actualizar' : 'crear'} el registro.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Cliente *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Empresa XYZ S.A."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identificador">Identificador/RUT *</Label>
                  <Input
                    id="identificador"
                    value={formData.identificador}
                    onChange={(e) => setFormData(prev => ({ ...prev, identificador: e.target.value }))}
                    placeholder="Ej: 987654321098"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Ej: contacto@cliente.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="Ej: 24011234"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <textarea
                    id="direccion"
                    className="w-full p-3 border rounded-md"
                    rows={3}
                    value={formData.direccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Dirección completa del cliente..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCliente ? 'Actualizar' : 'Crear'} Cliente
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
            <p className="text-xs text-muted-foreground">
              Activos en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Privadas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter(c => getClienteType(c.identificador).type === 'Empresa').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sector privado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gobierno</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter(c => getClienteType(c.identificador).type === 'Gobierno').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sector público
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, RUT o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Listado de Clientes</span>
          </CardTitle>
          <CardDescription>
            Gestione la información de clientes del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Identificador/RUT</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => {
                const clienteType = getClienteType(cliente.identificador)
                return (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nombre}</TableCell>
                    <TableCell>{cliente.identificador}</TableCell>
                    <TableCell>
                      <Badge variant={clienteType.variant}>
                        {clienteType.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {cliente.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{cliente.email}</span>
                          </div>
                        )}
                        {cliente.telefono && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{cliente.telefono}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={cliente.direccion}>
                        {cliente.direccion || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(cliente)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cliente.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={hasAssociatedLicitaciones(cliente.id)}
                          title={hasAssociatedLicitaciones(cliente.id) ? 'No se puede eliminar, tiene licitaciones asociadas' : 'Eliminar cliente'}
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