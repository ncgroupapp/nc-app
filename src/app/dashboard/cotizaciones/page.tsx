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
import { Search, Loader2, Eye, Calculator, FileDown, Plus, Hash, FileText } from 'lucide-react'
import { cotizacionesService, Quotation, QuotationFilters } from '@/services/cotizaciones.service'
import { QuotationStatus, Currency } from '@/types'
import { showSnackbar } from '@/components/ui/snackbar'

// Helper to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

// Helper to format currency
const formatCurrency = (amount: number, currency: string = 'UYU') => {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

const statusConfig: Record<string, { label: string; color: string }> = {
  [QuotationStatus.CREATED]: { label: 'Creada', color: 'bg-muted/50 text-muted-foreground border-border' },
  [QuotationStatus.FINALIZED]: { label: 'Finalizada', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
}

export default function CotizacionesPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<QuotationFilters>({
    page: 1,
    limit: 10,
    status: undefined,
  })
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [downloadingPdf, setDownloadingPdf] = useState<number | null>(null)

  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const response = await cotizacionesService.getAll(filters)
      setQuotations(response.data || [])
      setTotalItems(response.meta?.total || 0)
      setTotalPages(response.meta?.lastPage || 1)
    } catch (error) {
      console.error('Error fetching quotations:', error)
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
    fetchQuotations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleStatusChange = (value: string) => {
    const status = value === 'all' ? undefined : (value as QuotationStatus)
    setFilters(prev => ({ ...prev, status, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleDownloadPdf = async (id: number, identifier: string) => {
    try {
      setDownloadingPdf(id)
      const blob = await cotizacionesService.downloadPdf(id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cotizacion_${identifier}_${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      showSnackbar('Error al descargar el PDF', 'error')
    } finally {
      setDownloadingPdf(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cotizaciones</h1>
          <p className="text-muted-foreground">
            Gestión de cotizaciones asociadas a licitaciones
          </p>
        </div>
        {/* Note: Quotations are typically created from a Licitation context, but we could add a button here if needed */}
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
                placeholder="Buscar por identificador o cliente..." 
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
                  <SelectItem value={QuotationStatus.CREATED}>Creada</SelectItem>
                  <SelectItem value={QuotationStatus.FINALIZED}>Finalizada</SelectItem>
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
            <Calculator className="h-5 w-5" />
            Listado de Cotizaciones
            <Badge variant="secondary" className="ml-2">{totalItems}</Badge>
          </CardTitle>
          <CardDescription>
            Historial completo de cotizaciones realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : quotations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron cotizaciones
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificador</TableHead>
                    <TableHead>Licitación</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Monto Total (c/IVA)</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quotation) => {
                    const statusInfo = statusConfig[quotation.status] || { label: quotation.status, color: 'bg-gray-100 text-gray-700' }
                    
                    // Frontend-side simple calculation of total if backend doesn't provide it directly in the list
                    // (Though ideally backend should). Based on type definition, we have items[].
                    const calculateTotal = () => {
                        return quotation.items.reduce((sum, item) => sum + (Number(item.priceWithIVA) * item.quantity), 0)
                    }
                    const total = calculateTotal()
                    const currency = quotation.items[0]?.currency || Currency.UYU

                    return (
                      <TableRow key={quotation.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                            <span className="flex items-center gap-1">
                                <Hash className="h-3 w-3 text-muted-foreground" />
                                {quotation.quotationIdentifier}
                            </span>
                            <div className="text-xs text-muted-foreground mt-1">ID: #{quotation.id}</div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/licitaciones/${quotation.licitationId}`} className="text-primary hover:underline flex items-center gap-1 font-medium">
                            <FileText className="h-4 w-4" />
                             Lic. #{quotation.licitationId}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{quotation.clientName || '-'}</TableCell>
                        <TableCell>{formatDate(quotation.quotationDate || quotation.createdAt)}</TableCell>
                        <TableCell>{formatDate(quotation.validUntil)}</TableCell>
                        <TableCell className="text-right font-semibold">
                            {formatCurrency(total, currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusInfo.color} font-medium`}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDownloadPdf(quotation.id, quotation.quotationIdentifier)}
                                disabled={downloadingPdf === quotation.id}
                                title="Descargar PDF"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                             >
                                {downloadingPdf === quotation.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <FileDown className="h-4 w-4" />
                                )}
                             </Button>
                             <Button variant="ghost" size="icon" asChild title="Ver Detalle" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                <Link href={`/dashboard/licitaciones/${quotation.licitationId}?tab=cotizaciones`}>
                                <Eye className="h-4 w-4" />
                                </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
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
