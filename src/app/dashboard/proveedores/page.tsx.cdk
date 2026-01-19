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
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, Globe } from 'lucide-react'
import { Proveedor } from '@/types'
import { proveedorSchema } from '@/lib/validations/schema'

// Mock data - en producción vendría de Supabase
const mockProveedores: Proveedor[] = [
  {
    id: '1',
    nombre: 'Proveedor A S.A.',
    pais: 'Uruguay',
    contacto: 'Juan Pérez',
    email: 'juan@proveedora.com',
    telefono: '099123456',
    direccion: 'Av. Italia 1234, Montevideo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    nombre: 'Tecno Solutions Ltda.',
    pais: 'Argentina',
    contacto: 'María García',
    email: 'maria@tecnosolutions.com',
    telefono: '011987654',
    direccion: 'Santa Fe 2850, Buenos Aires',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    nombre: 'Global Import Export',
    pais: 'Brasil',
    contacto: 'Carlos Silva',
    email: 'carlos@globalimport.com',
    telefono: '0215555888',
    direccion: 'Av. Paulista 1000, São Paulo',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  },
  {
    id: '4',
    nombre: 'Hardware Supplies Inc.',
    pais: 'China',
    contacto: 'Li Wei',
    email: 'liwei@hardwaresupplies.cn',
    telefono: '+861234567890',
    direccion: 'Shanghai Business District, Shanghai',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z'
  }
]

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>(mockProveedores)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPais, setSelectedPais] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    pais: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: ''
  })

  const paisesUnicos = Array.from(new Set(proveedores.map(p => p.pais)))

  const filteredProveedores = proveedores.filter(proveedor => {
    const matchesSearch = proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proveedor.contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proveedor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPais = selectedPais === 'all' || proveedor.pais === selectedPais
    return matchesSearch && matchesPais
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingProveedor) {
      // Editar proveedor existente
      setProveedores(prev => prev.map(p =>
        p.id === editingProveedor.id
          ? {
              ...p,
              ...formData,
              updated_at: new Date().toISOString()
            }
          : p
      ))
    } else {
      // Crear nuevo proveedor
      const newProveedor: Proveedor = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setProveedores(prev => [...prev, newProveedor])
    }

    // Reset form
    setFormData({
      nombre: '',
      pais: '',
      contacto: '',
      email: '',
      telefono: '',
      direccion: ''
    })
    setEditingProveedor(null)
    setIsCreateDialogOpen(false)
  }

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor)
    setFormData({
      nombre: proveedor.nombre,
      pais: proveedor.pais,
      contacto: proveedor.contacto,
      email: proveedor.email || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || ''
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este proveedor?')) {
      setProveedores(prev => prev.filter(p => p.id !== id))
    }
  }

  const hasAssociatedProducts = (proveedorId: string) => {
    // En producción, verificar si hay productos asociados
    return false
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">
            Gestión de proveedores del sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProveedor(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingProveedor ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
              </DialogTitle>
              <DialogDescription>
                Complete los datos del proveedor para {editingProveedor ? 'actualizar' : 'crear'} el registro.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Proveedor *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Proveedor A S.A."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pais">País *</Label>
                    <Input
                      id="pais"
                      value={formData.pais}
                      onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
                      placeholder="Ej: Uruguay"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contacto">Contacto *</Label>
                    <Input
                      id="contacto"
                      value={formData.contacto}
                      onChange={(e) => setFormData(prev => ({ ...prev, contacto: e.target.value }))}
                      placeholder="Ej: Juan Pérez"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Ej: contacto@proveedor.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="Ej: 099123456"
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
                    placeholder="Dirección completa del proveedor..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProveedor ? 'Actualizar' : 'Crear'} Proveedor
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
            <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proveedores.length}</div>
            <p className="text-xs text-muted-foreground">
              Activos en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Países</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paisesUnicos.length}</div>
            <p className="text-xs text-muted-foreground">
              Diferentes países
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacto Verificado</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {proveedores.filter(p => p.telefono && p.email).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Con teléfono y email
            </p>
          </CardContent>
        </Card>
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
                  placeholder="Buscar por nombre, contacto o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={selectedPais}
                onChange={(e) => setSelectedPais(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todos los países</option>
                {paisesUnicos.map((pais) => (
                  <option key={pais} value={pais}>
                    {pais}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Listado de Proveedores</span>
          </CardTitle>
          <CardDescription>
            Gestione la información de proveedores del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProveedores.map((proveedor) => (
                <TableRow key={proveedor.id}>
                  <TableCell className="font-medium">{proveedor.nombre}</TableCell>
                  <TableCell>{proveedor.contacto}</TableCell>
                  <TableCell>{proveedor.pais}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{proveedor.email || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{proveedor.telefono || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(proveedor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(proveedor.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={hasAssociatedProducts(proveedor.id)}
                        title={hasAssociatedProducts(proveedor.id) ? 'No se puede eliminar, tiene productos asociados' : 'Eliminar proveedor'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}