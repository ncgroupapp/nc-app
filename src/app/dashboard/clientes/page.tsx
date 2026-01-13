'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import { ActionCell, ExpandableListCell } from '@/components/ui/data-table-cells'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Search, Building2, Phone, Mail } from 'lucide-react'
import { Cliente } from '@/types'
import { useClientesStore } from '@/stores'

import { ClientForm } from '@/components/clientes/client-form'

export default function ClientesPage() {
  const { 
    clientes, 
    isLoading, 
    error,
    pagination,
    fetchClientes, 
    createCliente, 
    updateCliente, 
    deleteCliente,
    setFilters,
    setCurrentPage,
    filters
  } = useClientesStore()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

  useEffect(() => {
    fetchClientes(pagination.page)
  }, [fetchClientes, pagination.page])

  const filteredClientes = clientes;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = async (clientData: any) => {
    try {
      if (editingCliente) {
        // Editar cliente existente
        await updateCliente(editingCliente.id, clientData)
      } else {
        // Crear nuevo cliente
        await createCliente(clientData)
      }

      setEditingCliente(null)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Error al guardar el cliente: ' + (error as Error).message)
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
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

  const columns: DataTableColumn<Cliente>[] = [
    {
      key: 'name',
      header: 'Nombre',
      accessorKey: 'name',
      className: 'font-medium'
    },
    {
      key: 'identifier',
      header: 'Identificador/RUT',
      accessorKey: 'identifier'
    },
    {
      key: 'contacts',
      header: 'Contacto',
      render: (cliente) => (
        <ExpandableListCell
          items={cliente.contacts || []}
          renderItem={(contact) => (
            <div className="text-sm">
              {contact.name && <div className="font-medium">{contact.name}</div>}
              {contact.email && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{contact.phone}</span>
                </div>
              )}
            </div>
          )}
        />
      )
    },
    {
      key: 'address',
      header: 'Dirección',
      render: (cliente) => (
        cliente.contacts?.[0]?.address && (
          <div className="max-w-xs truncate" title={cliente.contacts[0].address}>
            {cliente.contacts[0].address}
          </div>
        )
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      render: (cliente) => (
        <ActionCell
          row={cliente}
          onEdit={handleEdit}
          onDelete={(c) => handleDelete(c.id)}
        />
      )
    }
  ]

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
            <ClientForm
              initialData={editingCliente}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
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
          <DataTable
            data={filteredClientes}
            columns={columns}
            isLoading={isLoading}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              totalPages: pagination.lastPage,
              onPageChange: setCurrentPage
            }}
            emptyMessage={error ? error : "No se encontraron clientes"}
          />
        </CardContent>
      </Card>
    </div>
  )
}
