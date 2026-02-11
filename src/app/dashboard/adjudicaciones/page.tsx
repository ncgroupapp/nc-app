'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Loader2, Eye, Gavel, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { adjudicacionesService, Adjudication, AdjudicationFilters } from '@/services/adjudicaciones.service'
import { AdjudicationStatus } from '@/types'

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU', // Defaulting to UYU for display, ideally should come from data
  }).format(amount)
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  [AdjudicationStatus.TOTAL]: { 
    label: 'Adjudicación Total', 
    color: 'bg-green-100 text-green-700 hover:bg-green-100/80',
    icon: CheckCircle
  },
  [AdjudicationStatus.PARTIAL]: { 
    label: 'Adjudicación Parcial', 
    color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80',
    icon: AlertCircle
  },
}

export default function AdjudicacionesPage() {
  const [adjudications, setAdjudications] = useState<Adjudication[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AdjudicationFilters>({
    page: 1,
    limit: 10,
    status: undefined,
  })
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAdjudications = async () => {
    try {
      setLoading(true)
      const response = await adjudicacionesService.getAll(filters)
      setAdjudications(response.data || [])
      setTotalItems(response.meta?.total || 0)
      setTotalPages(response.meta?.lastPage || 1)
    } catch (error) {
      console.error('Error fetching adjudications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdjudications()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Simple searching by filtering the current list or triggering a backend search if API supports it
  // Given current service implementation, we rely on backend filters. 
  // If 'search' is not supported by backend for adjudications, we might need to implement it.
  // Checking service: 'search' param is generic, but let's assume filtering by ID mainly.
  
  const handleStatusChange = (value: string) => {
    const status = value === 'all' ? undefined : (value as AdjudicationStatus)
    setFilters(prev => ({ ...prev, status, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Adjudicaciones</h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de adjudicaciones
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar (Próximamente)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                disabled
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select onValueChange={handleStatusChange} defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value={AdjudicationStatus.TOTAL}>Total</SelectItem>
                  <SelectItem value={AdjudicationStatus.PARTIAL}>Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Listado de Adjudicaciones
            <Badge variant="secondary" className="ml-2">{totalItems}</Badge>
          </CardTitle>
          <CardDescription>
            Detalle de productos adjudicados por cotización y licitación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : adjudications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron adjudicaciones
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Referencias</TableHead>
                    <TableHead>Productos Adjudicados</TableHead>
                    <TableHead>Totales</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjudications.map((adj) => {
                    const statusInfo = statusConfig[adj.status] || { label: adj.status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
                    const StatusIcon = statusInfo.icon

                    return (
                      <TableRow key={adj.id}>
                        <TableCell className="font-medium">#{adj.id}</TableCell>
                        <TableCell>{formatDate(adj.adjudicationDate)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <Link href={`/dashboard/licitaciones/${adj.licitationId}`} className="text-blue-600 hover:underline flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Lic. #{adj.licitationId}
                            </Link>
                            <Link href={`/dashboard/cotizaciones/${adj.quotationId}`} className="text-blue-600 hover:underline flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Cot. #{adj.quotationId}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-h-[100px] overflow-y-auto pr-2 space-y-1">
                            {adj.items.map((item, idx) => (
                              <div key={idx} className="text-sm border-b last:border-0 pb-1 last:pb-0 border-dashed border-gray-200">
                                <div className="font-medium text-gray-900">{item.productName || `Producto #${item.productId}`}</div>
                                <div className="text-xs text-gray-500 flex justify-between">
                                  <span>Cant: {item.quantity}</span>
                                  <span>{formatCurrency(Number(item.unitPrice))} un.</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="font-medium text-gray-900">Total: {formatCurrency(Number(adj.totalPriceWithIVA))}</span>
                            <span className="text-xs text-gray-500">Subtotal: {formatCurrency(Number(adj.totalPriceWithoutIVA))}</span>
                            <span className="text-xs text-gray-500">Items: {adj.totalQuantity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusInfo.color} border-0 flex w-fit gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/licitaciones/${adj.licitationId}?tab=adjudicaciones`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination Controls could go here */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page! - 1)}
              disabled={filters.page === 1 || loading}
            >
              Anterior
            </Button>
            <div className="text-sm text-muted-foreground">
              Página {filters.page} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page! + 1)}
              disabled={filters.page === totalPages || loading}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
