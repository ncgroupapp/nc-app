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
import { ExpandableListCell } from '@/components/ui/data-table-cells'
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
    color: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',
    icon: CheckCircle
  },
  [AdjudicationStatus.PARTIAL]: { 
    label: 'Adjudicación Parcial', 
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20',
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

  // Effect to debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm || undefined, page: 1 }))
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchAdjudications()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Backend supports ID filtering via search.
  
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
                placeholder="Buscar por ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
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
          <CardTitle className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              <span>Listado de Adjudicaciones</span>
            </div>
            <Badge variant="outline">{totalItems} adjudicaciones</Badge>
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
                      <TableRow key={adj.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium text-muted-foreground">#{adj.id}</TableCell>
                        <TableCell>{formatDate(adj.adjudicationDate)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2 text-sm">
                            <Link href={`/dashboard/licitaciones/${adj.licitationId}`} className="text-primary font-medium hover:underline flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5" /> Lic. #{adj.licitationId}
                            </Link>
                            <Link href={`/dashboard/cotizaciones/${adj.quotationId}`} className="text-primary font-medium hover:underline flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5" /> Cot. #{adj.quotationId}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ExpandableListCell
                            items={adj.items}
                            limit={2}
                            label={`Productos - Adjudicación #${adj.id}`}
                            renderItem={(item) => (
                              <div className="text-sm py-1">
                                <div className="font-medium">{item.productName || `Producto #${item.productId}`}</div>
                                <div className="text-xs text-muted-foreground flex justify-between mt-1">
                                  <span>Cant: {item.quantity}</span>
                                  <span>{formatCurrency(Number(item.unitPrice))} un.</span>
                                </div>
                              </div>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm gap-1">
                            <span className="font-semibold text-primary">Total: {formatCurrency(Number(adj.totalPriceWithIVA))}</span>
                            <span className="text-xs text-muted-foreground">Subtotal: {formatCurrency(Number(adj.totalPriceWithoutIVA))}</span>
                            <span className="text-xs text-muted-foreground">Items: {adj.totalQuantity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusInfo.color} flex w-fit gap-1.5 items-center font-medium`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
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
