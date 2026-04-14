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
  const [importDate, setImportDate] = useState<Date | undefined>()
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
    importDate ? `Fecha: ${format(importDate, 'dd/MM/yyyy')}` : null,
    !importDate && fromDate ? `Desde: ${format(fromDate, 'dd/MM/yyyy')}` : null,
    !importDate && toDate ? `Hasta: ${format(toDate, 'dd/MM/yyyy')}` : null,
  ].filter(Boolean) as string[]

  const hasDateFilters = !!(importDate || fromDate || toDate)

  // Initial fetch
  useEffect(() => {
    fetchImportaciones(1)
  }, [fetchImportaciones])

  // Sync filters
  useEffect(() => {
    const status = selectedEstado !== 'all' ? selectedEstado : undefined
    const providerId = selectedProveedor !== 'all' ? selectedProveedor : undefined
    const exactImportDate = importDate ? format(importDate, 'yyyy-MM-dd') : undefined
    const rangeFromDate = !exactImportDate && fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined
    const rangeToDate = !exactImportDate && toDate ? format(toDate, 'yyyy-MM-dd') : undefined

    fetchImportaciones(
      1,
      debouncedSearch || undefined,
      status,
      providerId,
      exactImportDate,
      rangeFromDate,
      rangeToDate,
    )
  }, [
    debouncedSearch,
    selectedEstado,
    selectedProveedor,
    importDate,
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
    setImportDate(undefined)
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
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white rounded-t-xl">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                  <Filter className="h-5 w-5 text-slate-600" /> Filtros y Búsqueda
                </CardTitle>
                <CardDescription className="mt-1">
                  Refiná el listado por texto, estado, proveedor o un rango de fechas.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white">
                  {activeFilters.length} filtros activos
                </Badge>
                <Button
                  variant="outline"
                  onClick={clearDateFilters}
                  disabled={!hasDateFilters}
                  className="shrink-0"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Limpiar fechas
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(180px,0.8fr)_minmax(260px,1fr)]">
                <div className="space-y-2 rounded-2xl border bg-slate-50/80 p-4">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    Búsqueda general
                  </div>
                  <div className="w-full">
                    <SearchInput
                      placeholder="Buscar por carpeta, folio o transportista..."
                      value={searchTerm}
                      onChange={setSearchTerm}
                    />
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border bg-slate-50/80 p-4">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    Estado
                  </div>
                  <div className="w-full">
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
                </div>

                <div className="space-y-2 rounded-2xl border bg-slate-50/80 p-4">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    Proveedor
                  </div>
                  <div className="w-full">
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
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-slate-800">
                    <CalendarRange className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-semibold">Filtro por fecha</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Usá una fecha exacta o un rango. Si elegís fecha exacta, el rango no se aplica.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      Fecha exacta
                    </div>
                    <DatePicker
                      date={importDate}
                      setDate={setImportDate}
                      placeholder="Fecha exacta"
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      Desde
                    </div>
                    <DatePicker
                      date={fromDate}
                      setDate={setFromDate}
                      placeholder="Desde"
                      disabled={(date) => !!toDate && date > toDate}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      Hasta
                    </div>
                    <DatePicker
                      date={toDate}
                      setDate={setToDate}
                      placeholder="Hasta"
                      disabled={(date) => !!fromDate && date < fromDate}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-slate-50/70 px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Activos
                </span>
                {activeFilters.length > 0 ? (
                  activeFilters.map((filter) => (
                    <Badge key={filter} variant="outline" className="bg-white text-slate-700">
                      {filter}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    No hay filtros aplicados. Mostrando todas las importaciones.
                  </span>
                )}
              </div>
            </div>
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
                  const exactImportDate = importDate ? format(importDate, 'yyyy-MM-dd') : undefined
                  const rangeFromDate = !exactImportDate && fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined
                  const rangeToDate = !exactImportDate && toDate ? format(toDate, 'yyyy-MM-dd') : undefined
                  fetchImportaciones(
                    page,
                    debouncedSearch || undefined,
                    estado,
                    proveedor_id,
                    exactImportDate,
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
