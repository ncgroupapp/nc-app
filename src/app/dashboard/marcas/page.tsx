'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
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
    await createBrand(data)
    setIsDialogOpen(false)
  }

  const handleUpdate = async (data: { name: string; models?: { name: string; id?: number }[] }) => {
    if (editingBrand) {
      await updateBrand(editingBrand.id, data)
      setEditingBrand(null)
      setIsDialogOpen(false)
    }
  }

  const handleDelete = async (brand: Brand) => {
    const confirmed = await confirm({
      title: 'Eliminar Marca',
      message: `¿Estás seguro de que deseas eliminar la marca "${brand.name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    })

    if (confirmed) {
      await deleteBrand(brand.id)
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
        <Button onClick={() => { setEditingBrand(null); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Marca
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar marcas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

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

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Editar Marca' : 'Nueva Marca'}</DialogTitle>
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
  )
}
