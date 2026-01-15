'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Plus, Search } from 'lucide-react'
import { Proveedor } from '@/types'
import { useProveedoresStore } from '@/stores'
import { ProveedorForm } from '@/components/proveedores/proveedor-form'

export default function ProveedoresPage() {
  const { 
    proveedores, 
    isLoading, 
    pagination,
    fetchProveedores, 
    createProveedor, 
    updateProveedor, 
    deleteProveedor,
    setFilters
  } = useProveedoresStore()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null)

  useEffect(() => {
    fetchProveedores(pagination.page)
  }, [fetchProveedores, pagination.page])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value })
  }

  const handleFormSubmit = async (data: unknown) => {
    try {
      if (editingProveedor) {
        await updateProveedor(editingProveedor.id, data as Partial<Proveedor>)
      } else {
        await createProveedor(data as any)
      }

      setEditingProveedor(null)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Error saving proveedor:', error)
      alert('Error al guardar el proveedor: ' + (error as Error).message)
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
      } catch (error) {
        console.error('Error deleting proveedor:', error)
        alert('Error al eliminar el proveedor: ' + (error as Error).message)
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
      key: 'pais',
      header: 'País',
      accessorKey: 'pais'
    },
    {
      key: 'contacts',
      header: 'Contactos',
      render: (row) => (
        <ExpandableListCell 
          items={(row as any).contacts || []}
          label="Contactos"
          renderItem={(contact: any) => (
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
      header: '',
      id: 'actions',
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
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Proveedores</h2>
          <p className="text-muted-foreground">
            Gestión de proveedores y sus contactos.
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o RUT..." 
            className="pl-8"
            onChange={handleSearchChange}
          />
        </div>
      </div>

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
    </div>
  )
}
