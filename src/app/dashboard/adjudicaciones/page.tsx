'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Eye, Gavel, Search, CheckCircle, Clock } from "lucide-react";
import { adjudicacionesService, Adjudication } from '@/services/adjudicaciones.service'
import { AdjudicationStatus } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/common/fade-in'

export default function AdjudicacionesPage() {
  const [adjudicaciones, setAdjudicaciones] = useState<Adjudication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [closedOnly, setClosedOnly] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1
  })

  const fetchAdjudicaciones = useCallback(async (page = 1, search = '', status = 'all', closedOnlyParam = false) => {
    try {
      setLoading(true)
      setError(null)
      const res = await adjudicacionesService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: status !== 'all' ? status as AdjudicationStatus : undefined,
        closedOnly: closedOnlyParam
      })

      // Data is in res.data array
      setAdjudicaciones(res.data || [])
      setPagination({
        page: res.meta?.page || 1,
        limit: res.meta?.limit || 10,
        total: res.meta?.total || 0,
        lastPage: res.meta?.lastPage || 1
      })
    } catch (err) {
      console.error('Error fetching adjudicaciones:', err)
      setError('No se pudieron cargar las adjudicaciones. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAdjudicaciones(1, searchTerm, statusFilter, closedOnly)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, closedOnly, fetchAdjudicaciones])

  const handlePageChange = (newPage: number) => {
    fetchAdjudicaciones(newPage, searchTerm, statusFilter, closedOnly)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
  }

  const handleClosedOnlyChange = (checked: boolean) => {
    setClosedOnly(checked)
  }

  const getStatusInfo = (status: AdjudicationStatus) => {
    switch (status) {
      case AdjudicationStatus.TOTAL:
        return { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Total" };
      case AdjudicationStatus.PARTIAL:
        return { icon: AlertCircle, color: "text-orange-600", bgColor: "bg-orange-100", label: "Parcial" };
      default:
        return { icon: Clock, color: "text-gray-600", bgColor: "bg-gray-100", label: status };
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return "-";
    
    return new Intl.NumberFormat('es-UY', { 
      style: 'currency', 
      currency: 'UYU',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericAmount);
  };

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Adjudicaciones</h1>
            <p className="text-muted-foreground">Gestión y seguimiento de adjudicaciones</p>
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
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Buscar por nombre o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  aria-label="Buscar adjudicaciones"
                />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select onValueChange={handleStatusChange} value={statusFilter}>
                  <SelectTrigger aria-label="Filtrar por estado">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value={AdjudicationStatus.TOTAL}>Total</SelectItem>
                    <SelectItem value={AdjudicationStatus.PARTIAL}>Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 px-2">
                <Checkbox
                  id="include-closed-adjud"
                  checked={closedOnly}
                  onCheckedChange={handleClosedOnlyChange}
                />
                <Label htmlFor="include-closed-adjud" className="text-sm cursor-pointer whitespace-nowrap">
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
              <CardTitle className="flex items-center gap-2"><Gavel className="h-5 w-5" /> Listado de Adjudicaciones</CardTitle>
              <Badge variant="secondary">{pagination.total} registros</Badge>
            </div>
            <CardDescription>Seguimiento de procesos adjudicados y sus estados</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="rounded-md border overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Identificador</TableHead>
                    <TableHead>Licitación</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : adjudicaciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No se encontraron adjudicaciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    adjudicaciones.map((adj) => {
                      const statusInfo = getStatusInfo(adj.status);
                      return (
                        <TableRow key={adj.id} className="hover:bg-muted/30 transition-colors group">
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                            #{adj.identifier || adj.id}
                          </TableCell>
                          <TableCell className="font-bold tracking-tight">
                            <div className="flex flex-col">
                              <span>{adj.licitation?.callNumber || `ID: ${adj.licitationId}`}</span>
                              {adj.licitation?.internalNumber && (
                                <span className="text-xs font-normal text-muted-foreground">
                                  {adj.licitation.internalNumber}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-muted-foreground">
                            {adj.licitation?.client?.name || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(adj.adjudicationDate || adj.createdAt).toLocaleDateString('es-CL')}
                          </TableCell>
                          <TableCell className="font-bold text-green-700">
                            {formatCurrency(adj.totalPriceWithIVA)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none font-medium`}>
                              <statusInfo.icon className="mr-1 h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/dashboard/licitaciones/${adj.licitationId}?tab=cotizaciones`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="group-hover:bg-primary/10 transition-colors"
                                aria-label={`Ver licitación ${adj.licitation?.callNumber || adj.licitation?.internalNumber || adj.licitationId}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Página {pagination.page} de {pagination.lastPage}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  aria-label="Página anterior"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.lastPage || loading}
                  aria-label="Página siguiente"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
