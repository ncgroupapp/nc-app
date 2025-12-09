'use client'

import { useState, useEffect } from 'react'
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
import { useClientesStore, selectFilteredClientes } from '@/stores'

export default function ClientesPage() {
  const { 
    clientes, 
    selectedCliente,
    isLoading, 
    error,
    fetchClientes, 
    createCliente, 
    updateCliente, 
    deleteCliente,
    setFilters,
    filters
  } = useClientesStore()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    identificador: '',
    email: '',
    telefono: '',
    direccion: ''
  })

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  const filteredClientes = selectFilteredClientes({ clientes, filters, isLoading, error, selectedCliente });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const clientData = {
        name: formData.nombre,
        identifier: formData.identificador,
        contacts: [{
          email: formData.email,
          phone: formData.telefono,
          address: formData.direccion
        }]
      };

      if (editingCliente) {
        // Editar cliente existente
        await updateCliente(editingCliente.id, clientData)
      } else {
        // Crear nuevo cliente
        await createCliente(clientData)
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
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Error al guardar el cliente: ' + (error as Error).message)
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    const contact = cliente.contacts?.[0] || {}
    setFormData({
      nombre: cliente.name,
      identificador: cliente.identifier,
      email: contact.email || '',
      telefono: contact.phone || '',
      direccion: contact.address || ''
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este cliente?')) {
      try {
        await deleteCliente(id)
      } catch (error) {
        console.error('Error deleting client:', error)
        alert('Error al eliminar el cliente: ' + (error as Error).message)
      }
    }
  }

  const getClienteType = (identifier: string) => {
    // Lógica para determinar si es empresa o gobierno basado en el identificador
    if (identifier.includes('gub.uy') || identifier.length < 12) {
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
            <Button onClick={() => {
              setEditingCliente(null)
              setFormData({
                nombre: '',
                identificador: '',
                email: '',
                telefono: '',
                direccion: ''
              })
            }}>
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : (editingCliente ? 'Actualizar' : 'Crear') + ' Cliente'}
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
              {clientes.filter(c => getClienteType(c.identifier).type === 'Empresa').length}
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
              {clientes.filter(c => getClienteType(c.identifier).type === 'Gobierno').length}
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
                  value={filters.search}
                  onChange={handleSearchChange}
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
              {isLoading && clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Cargando clientes...
                  </TableCell>
                </TableRow>
              ) : filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    {error ? <span className="text-red-500">{error}</span> : 'No se encontraron clientes'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => {
                  const clienteType = getClienteType(cliente.identifier)
                  const contact = cliente.contacts?.[0]
                  return (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.name}</TableCell>
                      <TableCell>{cliente.identifier}</TableCell>
                      <TableCell>
                        <Badge variant={clienteType.variant}>
                          {clienteType.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {contact?.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{contact.email}</span>
                            </div>
                          )}
                          {contact?.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact?.address && (
                        <div className="max-w-xs truncate" title={contact.address}>
                          {contact.address}
                        </div>
                        )
                        }
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
                            title="Eliminar cliente"
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
        </CardContent>
      </Card>
    </div>
  )
}
