'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calculator, Eye, Search } from "lucide-react";
import { cotizacionesService, Quotation, QuotationStatus } from '@/services/cotizaciones.service'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/common/fade-in'
import { Label } from '@/components/ui/label'

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [closedOnly, setClosedOnly] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1
  })

  const fetchCotizaciones = async (page = 1, search = '', status = 'all', closedOnlyParam = false) => {
    try {
      setLoading(true)
      const res = await cotizacionesService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: status !== 'all' ? status as QuotationStatus : undefined,
        closedOnly: closedOnlyParam
      })
      setCotizaciones(res.data || [])
      setPagination({
        page: res.meta?.page || 1,
        limit: res.meta?.limit || 10,
        total: res.meta?.total || 0,
        lastPage: res.meta?.lastPage || 1
      })
    } catch (err) {
      console.error('Error fetching cotizaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCotizaciones(1, searchTerm, statusFilter, closedOnly)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, closedOnly])

  const handlePageChange = (newPage: number) => {
    fetchCotizaciones(newPage, searchTerm, statusFilter, closedOnly)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
  }

  const handleClosedOnlyChange = (checked: boolean) => {
    setClosedOnly(checked)
  }

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case QuotationStatus.CREATED:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Creada</Badge>
      case QuotationStatus.FINALIZED:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Finalizada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: DataTableColumn<Quotation>[] = [
    {
      key: "quotationIdentifier",
      header: "Identificador",
      render: (cot) => <span className="font-mono text-xs text-muted-foreground">{cot.quotationIdentifier || '-'}</span>,
    },
    {
      key: "licitationId",
      header: "Licitación (Nº Llamado)",
      render: (cot) => <span className="font-medium">{cot.licitationId ? `#${cot.licitationId}` : '-'}</span>,
    },
    {
      key: "clientName",
      header: "Cliente",
      accessorKey: "clientName",
    },
    {
      key: "createdAt",
      header: "Fecha",
      render: (cot) => new Date(cot.createdAt).toLocaleDateString('es-CL'),
    },
    {
      key: "status",
      header: "Estado",
      render: (cot) => getStatusBadge(cot.status),
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right",
      render: (cot) => (
        <div className="flex justify-end">
          <Link href={`/dashboard/licitaciones/${cot.licitationId}?tab=cotizaciones`}>
            <Button variant="ghost" size="icon" aria-label={`Ver licitación de cotización ${cot.quotationIdentifier}`}>
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cotizaciones</h1>
            <p className="text-muted-foreground">Gestión de cotizaciones asociadas a licitaciones</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" /> Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por identificador o cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select onValueChange={handleStatusChange} defaultValue="all">
                  <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value={QuotationStatus.CREATED}>Creada</SelectItem>
                    <SelectItem value={QuotationStatus.FINALIZED}>Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 px-2">
                <Checkbox
                  id="include-closed"
                  checked={closedOnly}
                  onCheckedChange={handleClosedOnlyChange}
                />
                <Label htmlFor="include-closed" className="text-sm cursor-pointer whitespace-nowrap">
                  Solo licitaciones cerradas
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={200}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" /> Listado de Cotizaciones</CardTitle>
              <Badge variant="secondary">{pagination.total} registros</Badge>
            </div>
            <CardDescription>Historial de cotizaciones generadas para los distintos llamados</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={cotizaciones}
              isLoading={loading}
              pagination={{
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.lastPage,
                onPageChange: handlePageChange,
              }}
              emptyMessage="No se encontraron cotizaciones"
            />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
