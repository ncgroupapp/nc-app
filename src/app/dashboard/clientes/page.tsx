'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import { ActionCell } from '@/components/ui/data-table-cells'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useClientesStore } from '@/stores/clientes/clientesStore'
import { Cliente, CreateClienteForm } from '@/types'
import { Building2, Mail, Phone, Plus, Search } from "lucide-react";
import { useEffect, useState } from 'react'
import { ClientForm } from '@/components/clientes/client-form'
import { SearchInput } from '@/components/common/search-input'
import { useConfirm } from '@/hooks/use-confirm'
import { useDebounce } from '@/hooks/use-debounce'
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/common/fade-in'


export default function ClientesPage() {
  const { 
    clientes, 
    isLoading, 
    pagination, 
    fetchClientes, 
    createCliente, 
    updateCliente, 
    deleteCliente,
    error
  } = useClientesStore()
  
  const { confirm } = useConfirm()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

  useEffect(() => {
    fetchClientes(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch, fetchClientes])

  const handleFormSubmit = async (data: CreateClienteForm) => {
    try {
      if (editingCliente) {
        // Ensure contacts have required 'name' property
        const fixedData = {
          ...data,
          contacts: data.contacts?.map(contact => ({
            name: contact.name ?? '',
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
          }))
        };
        await updateCliente(editingCliente.id, fixedData)
      } else {
        await createCliente(data)
      }
      setIsCreateDialogOpen(false)
      setEditingCliente(null)
    } catch (error) {
      console.error('Error saving cliente:', error)
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setIsCreateDialogOpen(true)
  }

  const handleView = (cliente: Cliente) => {
    router.push(`/dashboard/clientes/${cliente.id}`)
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
        console.error('Error deleting cliente:', error)
      }
    }
  }

  const columns: DataTableColumn<Cliente>[] = [
    { key: 'name', header: 'Nombre', accessorKey: 'name', className: 'font-medium' },
    { key: 'identifier', header: 'Identificador', accessorKey: 'identifier' },
    { key: 'email', header: 'Email', render: (row) => row.email ? (<div className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" />{row.email}</div>) : '-' },
    { key: 'phone', header: 'Teléfono', render: (row) => row.phone ? (<div className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" />{row.phone}</div>) : '-' },
    { key: 'address', header: 'Dirección', accessorKey: 'address' },
    { key: 'actions', header: 'Acciones', className: 'text-right', render: (row) => (<ActionCell row={row} onView={handleView} onEdit={handleEdit} onDelete={(p) => handleDelete(p.id)} />) }
  ]

  const handleDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open)
    if (!open) { setTimeout(() => setEditingCliente(null), 300) }
  }

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">Gestión de clientes y organismos.</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCliente(null)}><Plus className="mr-2 h-4 w-4" /> Nuevo Cliente</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingCliente ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
                <DialogDescription>{editingCliente ? "Modifique los datos del cliente." : "Complete la información para registrar un nuevo cliente."}</DialogDescription>
              </DialogHeader>
              <ClientForm initialData={editingCliente} onSubmit={handleFormSubmit} onCancel={() => setIsCreateDialogOpen(false)} isLoading={isLoading} />
            </DialogContent>
          </Dialog>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" /> Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <SearchInput placeholder="Buscar por nombre, identificador o email..." value={searchTerm} onChange={setSearchTerm} />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={200}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Listado de Clientes</span>
              <Badge variant="outline">{pagination.total} clientes</Badge>
            </CardTitle>
            <CardDescription>Gestione la información de clientes del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={clientes} isLoading={isLoading} pagination={{ page: pagination.page, limit: pagination.limit, total: pagination.total, totalPages: pagination.lastPage, onPageChange: setCurrentPage, }} emptyMessage={error ? error : "No se encontraron clientes"} />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
