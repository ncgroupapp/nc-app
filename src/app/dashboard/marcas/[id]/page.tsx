'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import { useBrandsStore } from '@/stores/brands/brandsStore'
import { Model } from '@/types'

export default function MarcaDetallePage() {
  const params = useParams()
  const router = useRouter()
  // As 'id' comes from the route segment [id], it's a string, so we cast it.
  const brandId = Number(params.id)
  
  const { selectedBrand, isLoading, fetchBrandById } = useBrandsStore()
  useEffect(() => {
    if (brandId) {
      fetchBrandById(brandId)
    }
  }, [brandId, fetchBrandById])

  const columns: DataTableColumn<Model>[] = [
    { key: 'name', header: 'Nombre', accessorKey: 'name' },
  ]

  if (!selectedBrand && !isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Marca no encontrada</div>
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="grid gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedBrand?.name || 'Cargando...'}
          </h1>
          <p className="text-muted-foreground">Gestión de modelos asociados</p>
        </div>
        <div className="ml-auto">
        </div>
      </div>

      <div className="mt-6 border rounded-md">
        <DataTable
          data={selectedBrand?.models || []}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No hay modelos registrados para esta marca."
          pagination={undefined} // Sin paginación por ahora para modelos
        />
      </div>
    </div>
  )
}
