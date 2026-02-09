'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from "next/navigation";
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
import { useClientesStore } from '@/stores'
import { Cliente } from '@/types'
import { Building2, Mail, Phone, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ClientForm } from '@/components/clientes/client-form'
import { SearchInput } from '@/components/common/search-input'
import { useConfirm } from '@/hooks/use-confirm'
import { useDebounce } from '@/hooks/use-debounce'


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
  
  const { confirm } = useConfirm()
    const router = useRouter()

  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

  const debouncedSearch = useDebounce(filters.search, 500)

  useEffect(() => {
    fetchClientes(pagination.page, debouncedSearch)
  }, [fetchClientes, pagination.page, debouncedSearch])

  const filteredClientes = clientes;

  const handleSearchChange = (value: string) => {
    setFilters({ search: value })
  }

  const handleView = (cliente: Cliente) => {
    router.push(`/dashboard/clientes/${cliente.id}`);
  };

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
    if (await confirm({
      title: 'Eliminar Cliente',
      message: '¿Está seguro que desea eliminar este cliente?',
      variant: 'destructive'
    })) {
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
          onView={handleView}
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
              <SearchInput
                placeholder="Buscar por nombre, RUT o email..."
                value={filters.search}
                onChange={handleSearchChange}
              />
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
