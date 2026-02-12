'use client'

import { useEffect, useState } from 'react'
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation'
import { Package, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import { ActionCell } from '@/components/ui/data-table-cells'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useBrandsStore } from '@/stores/brands/brandsStore'
import { MarcaForm } from '@/components/marcas/marca-form'
import { useConfirm } from '@/hooks/use-confirm'
import { Brand } from '@/types'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function MarcasPage() {
  const router = useRouter()
  const { brands, isLoading, total, fetchBrands, createBrand, updateBrand, deleteBrand } = useBrandsStore()
  const { confirm } = useConfirm()

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [currentPage, setCurrentPage] = useState(1)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)

  useEffect(() => {
    fetchBrands(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch, fetchBrands])

  const handleCreate = async (data: { name: string; models?: { name: string; id?: number }[] }) => {
    try {
      await createBrand(data)
      toast.success("Marca creada exitosamente")
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating brand:', error)
      toast.error('Error al crear la marca')
    }
  }

  const handleUpdate = async (data: { name: string; models?: { name: string; id?: number }[] }) => {
    if (editingBrand) {
      try {
        await updateBrand(editingBrand.id, data)
        toast.success("Marca actualizada exitosamente")
        setEditingBrand(null)
        setIsDialogOpen(false)
      } catch (error) {
        console.error('Error updating brand:', error)
        toast.error('Error al actualizar la marca')
      }
    }
  }

  const handleDelete = async (brand: Brand) => {
    const confirmed = await confirm({
      title: "Eliminar Marca",
      message: `¿Estás seguro de que deseas eliminar la marca "${brand.name}"?`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deleteBrand(brand.id)
        toast.success("Marca eliminada exitosamente")
      } catch (error) {
        console.error('Error deleting brand:', error)
        toast.error('Error al eliminar la marca')
      }
    }
  }

  const columns: DataTableColumn<Brand>[] = [
    { key: 'name', header: 'Nombre', accessorKey: 'name' },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-[100px]',
      render: (brand) => (
        <ActionCell
          row={brand}
          onView={() => router.push(`/dashboard/marcas/${brand.id}`)}
          onEdit={() => {
            setEditingBrand(brand)
            setIsDialogOpen(true)
          }}
          onDelete={() => handleDelete(brand)}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Marcas</h1>
        <Button
          onClick={() => {
            setEditingBrand(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Marca
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className='relative'>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar marcas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Listado de Marcas</span>
            <Badge variant="outline">{brands.length} marcas</Badge>
          </CardTitle>
          <CardDescription>Gestione el inventario de marcas del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={brands}
            columns={columns}
            isLoading={isLoading}
            pagination={{
              page: currentPage,
              limit: 10,
              total: total,
              totalPages: Math.ceil(total / 10),
              onPageChange: setCurrentPage,
            }}
          />
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && setIsDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? "Editar Marca" : "Nueva Marca"}
            </DialogTitle>
          </DialogHeader>
          <MarcaForm
            initialData={editingBrand}
            onSubmit={editingBrand ? handleUpdate : handleCreate}
            onCancel={() => setIsDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
