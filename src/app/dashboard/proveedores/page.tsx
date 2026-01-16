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
import { Plus, Search, Building2 } from 'lucide-react'
import { Proveedor, CreateProveedorForm } from '@/types'
import { useProveedoresStore } from '@/stores'
import { ProveedorForm } from '@/components/proveedores/proveedor-form'
import { showSnackbar } from '@/components/ui/snackbar'

export default function ProveedoresPage() {
  const { 
    proveedores, 
    isLoading, 
    pagination,
    fetchProveedores, 
    createProveedor, 
    updateProveedor, 
    deleteProveedor,
    setFilters,
    filters 
  } = useProveedoresStore()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null)

  useEffect(() => {
    fetchProveedores(pagination.page)
  }, [fetchProveedores, pagination.page])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ query: e.target.value })
  }

  const handleFormSubmit = async (data: CreateProveedorForm | Partial<Proveedor>) => {
    try {
      if (editingProveedor) {
        await updateProveedor(editingProveedor.id, data as Partial<Proveedor>)
        showSnackbar('Proveedor actualizado correctamente', 'success')
      } else {
        await createProveedor(data as CreateProveedorForm)
        showSnackbar('Proveedor creado correctamente', 'success')
      }

      setEditingProveedor(null)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Error saving proveedor:', error)
      showSnackbar('Error al guardar el proveedor: ' + (error as Error).message, 'error')
    }
  }

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor)
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este proveedor?')) {
      try {
        await deleteProveedor(id)
        showSnackbar('Proveedor eliminado correctamente', 'success')
      } catch (error) {
        console.error('Error deleting proveedor:', error)
        showSnackbar('Error al eliminar el proveedor: ' + (error as Error).message, 'error')
      }
    }
  }

  const columns: DataTableColumn<Proveedor>[] = [
    {
      key: 'name',
      header: 'Nombre',
      accessorKey: 'name',
      className: 'font-medium'
    },
    {
      key: 'rut',
      header: 'RUT',
      accessorKey: 'rut'
    },
    {
      key: 'country',
      header: 'País',
      accessorKey: 'country'
    },
    {
      key: 'contacts',
      header: 'Contactos',
      render: (row) => (
        <ExpandableListCell 
          items={row.contacts || []}
          renderItem={(contact) => (
             <div className="text-sm py-1">
                 <div className="font-medium">{contact.name}</div>
                 {contact.role && <div className="text-xs text-muted-foreground">{contact.role}</div>}
                 {contact.email && <div className="text-xs text-muted-foreground">{contact.email}</div>}
             </div>
          )}
        />
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      render: (row) => (
        <ActionCell 
          row={row} 
          onEdit={handleEdit}
          onDelete={(p) => handleDelete(p.id)}
        />
      )
    }
  ]

  const handleDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open)
    if (!open) {
      setTimeout(() => setEditingProveedor(null), 300)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">
            Gestión de proveedores y sus contactos.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProveedor(null)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
              <DialogDescription>
                {editingProveedor 
                  ? 'Modifique los datos del proveedor y sus contactos.' 
                  : 'Complete la información para registrar un nuevo proveedor.'}
              </DialogDescription>
            </DialogHeader>
            <ProveedorForm 
              initialData={editingProveedor}
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
                  placeholder="Buscar por nombre o RUT..." 
                  className="pl-10"
                  value={filters?.query || ''}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proveedores Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Listado de Proveedores</span>
          </CardTitle>
          <CardDescription>
            Gestione la información de proveedores del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={proveedores} 
            isLoading={isLoading}
            pagination={{
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.lastPage,
                onPageChange: (page) => fetchProveedores(page)
            }}
            emptyMessage={'No se encontraron proveedores'}
          />
        </CardContent>
      </Card>
    </div>
  )
}
