'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Building2, Plus, Search } from "lucide-react";
import { Proveedor, CreateProveedorForm } from '@/types'
import { useProveedoresStore } from '@/stores'
import { ProveedorForm } from '@/components/proveedores/proveedor-form'
import { showSnackbar } from '@/components/ui/snackbar'
import { useConfirm } from '@/hooks/use-confirm'
import { FadeIn } from '@/components/common/fade-in'

export default function ProveedoresPage() {
  const { 
    proveedores, 
    isLoading, 
    pagination,
    fetchProveedores, 
    createProveedor, 
    updateProveedor, 
    deleteProveedor,
  } = useProveedoresStore()
  
  const { confirm } = useConfirm()
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null)

  const [brandsDialogOpen, setBrandsDialogOpen] = useState(false)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedProviderName, setSelectedProviderName] = useState('')

  useEffect(() => {
    fetchProveedores(1)
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProveedores(1, searchTerm || undefined)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleFormSubmit = async (data: any) => {
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
      showSnackbar('Error al guardar el proveedor', 'error')
    }
  }

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor)
    setIsCreateDialogOpen(true)
  }

  const handleView = (proveedor: Proveedor) => {
    router.push(`/dashboard/proveedores/${proveedor.id}`)
  }

  const handleDelete = async (id: string) => {
    if (await confirm({ 
      title: 'Eliminar Proveedor', 
      message: '¿Está seguro que desea eliminar este proveedor?',
      variant: 'destructive'
    })) {
      try {
        await deleteProveedor(id)
        showSnackbar('Proveedor eliminado correctamente', 'success')
      } catch (error) {
        console.error('Error deleting proveedor:', error)
        showSnackbar('Error al eliminar el proveedor', 'error')
      }
    }
  }

  const handleShowAllBrands = (brands: string[], providerName: string) => {
    setSelectedBrands(brands)
    setSelectedProviderName(providerName)
    setBrandsDialogOpen(true)
  }

  const columns: DataTableColumn<Proveedor>[] = [
    { key: 'name', header: 'Nombre', accessorKey: 'name', className: 'font-medium' },
    { key: 'rut', header: 'RUT', accessorKey: 'rut' },
    { key: 'country', header: 'País', accessorKey: 'country' },
    {
      key: 'brand', header: 'Marcas',
      render: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.brands && row.brands.length > 0 ? (
            <>
              {row.brands.slice(0, 3).map((b, i) => (<Badge key={i} variant="outline" className="text-xs whitespace-nowrap">{b}</Badge>))}
              {row.brands.length > 3 && (<Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80" onClick={() => handleShowAllBrands(row.brands || [], row.name)}>+{row.brands.length - 3}</Badge>)}
            </>
          ) : (<span className="text-muted-foreground text-sm">-</span>)}
        </div>
      )
    },
    { key: 'contacts', header: 'Contactos', render: (row) => (<ExpandableListCell items={row.contacts || []} renderItem={(contact) => (<div className="text-sm py-1"><div className="font-medium">{contact.name}</div>{contact.role && <div className="text-xs text-muted-foreground">{contact.role}</div>}{contact.email && <div className="text-xs text-muted-foreground">{contact.email}</div>}</div>)} />) },
    { key: 'actions', header: 'Acciones', className: 'text-right', render: (row) => (<ActionCell row={row} onView={handleView} onEdit={handleEdit} onDelete={(p) => handleDelete(p.id)} />) }
  ]

  const handleDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open)
    if (!open) { setTimeout(() => setEditingProveedor(null), 300) }
  }

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
            <p className="text-muted-foreground">Gestión de proveedores y sus contactos.</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogChange}>
            <Button onClick={() => setEditingProveedor(null)}><Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor</Button>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
                <DialogDescription>{editingProveedor ? "Modifique los datos del proveedor y sus contactos." : "Complete la información para registrar un nuevo proveedor."}</DialogDescription>
              </DialogHeader>
              <ProveedorForm initialData={editingProveedor} onSubmit={handleFormSubmit} onCancel={() => setIsCreateDialogOpen(false)} isLoading={isLoading} />
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input placeholder="Buscar por nombre, RUT, país o marca..." className="pl-10" value={searchTerm} onChange={handleSearchChange} />
                </div>
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
              <span>Listado de Proveedores</span>
              <Badge variant="outline">{proveedores.length} proveedores</Badge>
            </CardTitle>
            <CardDescription>Gestione la información de proveedores del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={proveedores} isLoading={isLoading} pagination={{ page: pagination.page, limit: pagination.limit, total: pagination.total, totalPages: pagination.lastPage, onPageChange: (page) => fetchProveedores(page), }} emptyMessage={"No se encontraron proveedores"} />
          </CardContent>
        </Card>
      </FadeIn>

      <Dialog open={brandsDialogOpen} onOpenChange={setBrandsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Marcas de {selectedProviderName}</DialogTitle>
            <DialogDescription>Listado completo de marcas asociadas a este proveedor.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <div className="flex flex-wrap gap-2">
              {selectedBrands.map((brand, index) => (<Badge key={index} variant="outline" className="text-sm">{brand}</Badge>))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
