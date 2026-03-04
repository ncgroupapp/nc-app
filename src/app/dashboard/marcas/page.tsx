'use client'

import { useEffect, useState } from 'react'
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation'
import { Package, Plus, Search } from "lucide-react";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import { ActionCell } from '@/components/ui/data-table-cells'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMarcasStore } from '@/stores'
import { Brand, CreateBrandDto } from '@/services/brands.service'
import { BrandForm } from '@/components/marcas/brand-form'
import { showSnackbar } from '@/components/ui/snackbar'
import { useConfirm } from '@/hooks/use-confirm'
import { useDebounce } from '@/hooks/use-debounce'
import { FadeIn } from '@/components/common/fade-in'

export default function MarcasPage() {
  const router = useRouter()
  const { 
    brands, 
    isLoading, 
    pagination, 
    fetchBrands, 
    createBrand, 
    updateBrand, 
    deleteBrand 
  } = useMarcasStore()
  
  const { confirm } = useConfirm()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)

  useEffect(() => {
    fetchBrands(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch, fetchBrands])

  const handleCreate = async (data: CreateBrandDto) => {
    try {
      await createBrand(data)
      showSnackbar('Marca creada correctamente', 'success')
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating brand:', error)
      showSnackbar('Error al crear la marca', 'error')
    }
  }

  const handleUpdate = async (data: CreateBrandDto) => {
    if (!editingBrand) return
    try {
      await updateBrand(editingBrand.id, data)
      showSnackbar('Marca actualizada correctamente', 'success')
      setIsDialogOpen(false)
      setEditingBrand(null)
    } catch (error) {
      console.error('Error updating brand:', error)
      showSnackbar('Error al actualizar la marca', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ 
      title: 'Eliminar Marca', 
      message: '¿Está seguro que desea eliminar esta marca?',
      variant: 'destructive'
    })) {
      try {
        await deleteBrand(id)
        showSnackbar('Marca eliminada correctamente', 'success')
      } catch (error) {
        console.error('Error deleting brand:', error)
        showSnackbar('Error al eliminar la marca', 'error')
      }
    }
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setIsDialogOpen(true)
  }

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setTimeout(() => setEditingBrand(null), 300)
    }
  }

  const columns: DataTableColumn<Brand>[] = [
    { key: 'name', header: 'Nombre', accessorKey: 'name', className: 'font-medium' },
    { key: 'description', header: 'Descripción', accessorKey: 'description' },
    { key: 'originCountry', header: 'Origen', accessorKey: 'originCountry' },
    { key: 'actions', header: 'Acciones', className: 'text-right', render: (row) => (<ActionCell row={row} onEdit={handleEdit} onDelete={(p) => handleDelete(p.id)} />) }
  ]

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marcas</h1>
            <p className="text-muted-foreground">Gestión de marcas de productos.</p>
          </div>
          <Button onClick={() => { setEditingBrand(null); setIsDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Nueva Marca</Button>
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
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Buscar por nombre o descripción..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={200}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Listado de Marcas</span>
              <Badge variant="outline">{pagination.total} marcas</Badge>
            </CardTitle>
            <CardDescription>Gestione las marcas de productos del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={brands} isLoading={isLoading} pagination={{ page: pagination.page, limit: pagination.limit, total: pagination.total, totalPages: pagination.lastPage, onPageChange: setCurrentPage, }} emptyMessage="No se encontraron marcas" />
          </CardContent>
        </Card>
      </FadeIn>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Editar Marca' : 'Nueva Marca'}</DialogTitle>
            <DialogDescription>{editingBrand ? 'Modifique los datos de la marca.' : 'Complete la información para registrar una nueva marca.'}</DialogDescription>
          </DialogHeader>
          <BrandForm initialData={editingBrand} onSubmit={editingBrand ? handleUpdate : handleCreate} onCancel={() => setIsDialogOpen(false)} isLoading={isLoading} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
