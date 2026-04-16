'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarRange, Filter, Plus, RotateCcw, Ship } from 'lucide-react'
import { format } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { DataTableColumn } from '@/components/ui/data-table'
import { ActionCell } from '@/components/ui/data-table-cells'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import { showSnackbar } from '@/components/ui/snackbar'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { DatePicker } from '@/components/ui/date-picker'

import { useConfirm } from '@/hooks/use-confirm'
import { useDebounce } from '@/hooks/use-debounce'
import { useImportacionesStore } from '@/stores/importaciones/importacionesStore'
import { formatCalendarDate } from '@/lib/utils'
import { proveedoresService } from '@/services/proveedores.service'
import { Importacion } from '@/types/importacion'
import { Proveedor } from '@/types/proveedor'

const ESTADO_STYLES: Record<Importacion['status'], string> = {
  'En Tránsito': 'bg-blue-100 text-blue-800 border-blue-200',
  'En Aduana': 'bg-amber-100 text-amber-800 border-amber-200',
  'Liberada': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Entregada': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
}

const ESTADOS = ['En Tránsito', 'En Aduana', 'Liberada', 'Entregada'] as const

const formatImportDate = (value?: string): string => formatCalendarDate(value)

export default function ImportacionesPage() {
  const router = useRouter()
  const {
    importaciones,
    isLoading,
    pagination,
    fetchImportaciones,
    deleteImportacion,
  } = useImportacionesStore()

  const { confirm } = useConfirm()

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [selectedEstado, setSelectedEstado] = useState<string>('all')
  const [selectedProveedor, setSelectedProveedor] = useState<string>('all')
  const [proveedorSearch, setProveedorSearch] = useState('')
  const [proveedorOptions, setProveedorOptions] = useState<Proveedor[]>([])
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()

  const selectedProveedorLabel =
    selectedProveedor !== 'all'
      ? proveedorOptions.find((provider) => provider.id.toString() === selectedProveedor)?.name ?? 'Proveedor'
      : null

  const activeFilters = [
    debouncedSearch ? `Busqueda: ${debouncedSearch}` : null,
    selectedEstado !== 'all' ? `Estado: ${selectedEstado}` : null,
    selectedProveedorLabel ? `Proveedor: ${selectedProveedorLabel}` : null,
    fromDate ? `Desde: ${format(fromDate, 'dd/MM/yyyy')}` : null,
    toDate ? `Hasta: ${format(toDate, 'dd/MM/yyyy')}` : null,
  ].filter(Boolean) as string[]

  const hasDateFilters = !!(fromDate || toDate)

  // Initial fetch
  useEffect(() => {
    fetchImportaciones(1)
  }, [fetchImportaciones])

  // Sync filters
  useEffect(() => {
    const status = selectedEstado !== 'all' ? selectedEstado : undefined
    const providerId = selectedProveedor !== 'all' ? selectedProveedor : undefined
    const rangeFromDate = fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined
    const rangeToDate = toDate ? format(toDate, 'yyyy-MM-dd') : undefined

    fetchImportaciones(
      1,
      debouncedSearch || undefined,
      status,
      providerId,
      undefined,
      rangeFromDate,
      rangeToDate,
    )
  }, [
    debouncedSearch,
    selectedEstado,
    selectedProveedor,
    fromDate,
    toDate,
    fetchImportaciones,
  ])

  // Proveedor search for filter
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const res = await proveedoresService.getAll({ search: proveedorSearch, limit: 20 })
        setProveedorOptions(res.data)
      } catch {
        // ignore
      }
    }, 300)
    return () => clearTimeout(id)
  }, [proveedorSearch])

  const handleView = (importacion: Importacion) => {
    router.push(`/dashboard/importaciones/${importacion.id}`)
  }

  const handleEdit = (importacion: Importacion) => {
    router.push(`/dashboard/importaciones/${importacion.id}/edit`)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Importación',
      message: '¿Está seguro que desea eliminar esta importación? Se eliminarán todos los costos y asociaciones.',
      variant: 'destructive',
    })

    if (confirmed) {
      try {
        await deleteImportacion(id)
        showSnackbar('Importación eliminada correctamente', 'success')
      } catch {
        showSnackbar('Error al eliminar la importación', 'error')
      }
    }
  }

  const clearDateFilters = () => {
    setFromDate(undefined)
    setToDate(undefined)
  }

  const columns: DataTableColumn<Importacion>[] = [
    {
      key: "folder",
      header: "Carpeta / Folio",
      className: "font-medium w-[140px]",
      render: (imp) => <span>{imp.folder}</span>,
    },
    {
      key: "provider",
      header: "Proveedor",
      className: "min-w-[160px]",
      render: (imp) => (
        <span className="text-sm">{imp.provider?.name ?? "—"}</span>
      ),
    },
    {
      key: "transport",
      header: "Transportista",
      className: "min-w-[140px]",
      render: (imp) => (
        <span className="text-sm">{imp.transport ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      className: "w-[130px]",
      render: (imp) => (
        <Badge variant="outline" className={ESTADO_STYLES[imp.status]}>
          {imp.status}
        </Badge>
      ),
    },
    {
      key: "importDate",
      header: "Fecha",
      className: "w-[120px]",
      render: (imp) => (
        <span className="text-sm tabular-nums">
          {formatImportDate(imp.importDate)}
        </span>
      ),
    },
    {
      key: "originCurrency",
      header: "Moneda",
      className: "w-[80px]",
      render: (imp) => (
        <Badge variant="outline" className="text-xs">
          {imp.originCurrency}
        </Badge>
      ),
    },
    {
      key: "subtotalA",
      header: "Total (USD)",
      className: "w-[120px] text-right",
      render: (imp) => {
        const total = (Number(imp.subtotalA) || 0) + (Number(imp.subtotalB) || 0) + (Number(imp.subtotalC) || 0)
        return (
          <span className="text-sm tabular-nums text-right block">
            {total.toLocaleString("es-UY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        )
      },
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right w-[100px]",
      render: (imp) => (
        <div className="flex justify-end">
          <ActionCell
            row={imp}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={(i) => handleDelete(i.id.toString())}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <PageHeader
          title="Importaciones"
          subtitle="Gestión de importaciones y costos asociados"
          backButton={false}
          actions={
            <Button onClick={() => router.push('/dashboard/importaciones/new')}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Importación
            </Button>
          }
        />
      </FadeIn>

      <FadeIn delay={100}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" /> Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <SearchInput
                  placeholder="Buscar por carpeta, folio o transportista..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </div>

              <div className="w-full md:w-48">
                <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {ESTADOS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-[250px]">
                <MultiSelectSearch
                  single
                  options={[
                    { id: 'all', label: 'Todos los proveedores' },
                    ...proveedorOptions.map((p) => ({ id: p.id, label: p.name })),
                  ]}
                  selectedValues={selectedProveedor === 'all' ? ['all'] : [selectedProveedor]}
                  onSelect={(val) => setSelectedProveedor(val.toString())}
                  onRemove={() => setSelectedProveedor('all')}
                  placeholder="Filtrar por proveedor"
                  searchPlaceholder="Buscar proveedor..."
                  searchValue={proveedorSearch}
                  onSearchValueChange={setProveedorSearch}
                  shouldFilter={false}
                  className="bg-white hover:bg-slate-50 transition-colors"
                />
              </div>

              <div className="w-full md:w-[150px]">
                <DatePicker
                  date={fromDate}
                  setDate={setFromDate}
                  placeholder="Desde"
                  className="w-full"
                />
              </div>

              <div className="w-full md:w-[150px]">
                <DatePicker
                  date={toDate}
                  setDate={setToDate}
                  placeholder="Hasta"
                  className="w-full"
                  disabled={(date) => !!fromDate && date < fromDate}
                />
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Filtros activos:
                </span>
                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="outline" className="bg-slate-50 text-slate-700">
                    {filter}
                  </Badge>
                ))}
                {(fromDate || toDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateFilters}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Limpiar fechas
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={200}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Ship className="h-5 w-5" />
              <span>Listado de Importaciones</span>
              <Badge variant="outline">{pagination.total} registros</Badge>
            </CardTitle>
            <CardDescription>
              Control de importaciones, estados y costos asociados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={importaciones}
              isLoading={isLoading}
              pagination={{
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.lastPage,
                onPageChange: (page) => {
                  const estado = selectedEstado !== 'all' ? selectedEstado : undefined
                  const proveedor_id =
                    selectedProveedor !== 'all' ? selectedProveedor : undefined
                  const rangeFromDate = fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined
                  const rangeToDate = toDate ? format(toDate, 'yyyy-MM-dd') : undefined
                  fetchImportaciones(
                    page,
                    debouncedSearch || undefined,
                    estado,
                    proveedor_id,
                    undefined,
                    rangeFromDate,
                    rangeToDate,
                  )
                },
              }}
              emptyMessage="No se encontraron importaciones"
            />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
