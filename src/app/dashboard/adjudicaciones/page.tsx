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
import { AlertCircle, CheckCircle, Eye, FileText, Gavel, Loader2, Search } from "lucide-react";
import { adjudicacionesService, Adjudication } from '@/services/adjudicaciones.service'
import { AdjudicationStatus } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/common/fade-in'

export default function AdjudicacionesPage() {
  const [adjudicaciones, setAdjudicaciones] = useState<Adjudication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1
  })

  const fetchAdjudicaciones = async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true)
      const res = await adjudicacionesService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: status !== 'all' ? status as AdjudicationStatus : undefined
      })
      setAdjudicaciones(res.data || [])
      setPagination({
        page: res.meta?.page || 1,
        limit: res.meta?.limit || 10,
        total: res.meta?.total || 0,
        lastPage: res.meta?.lastPage || 1
      })
    } catch (err) {
      console.error('Error fetching adjudicaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAdjudicaciones(1, searchTerm, statusFilter)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter])

  const handlePageChange = (newPage: number) => {
    fetchAdjudicaciones(newPage, searchTerm, statusFilter)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
  }

  const getStatusBadge = (status: AdjudicationStatus) => {
    switch (status) {
      case AdjudicationStatus.TOTAL:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Total</Badge>
      case AdjudicationStatus.PARTIAL:
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Parcial</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

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
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select onValueChange={handleStatusChange} defaultValue="all">
                  <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Licitación</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
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
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : adjudicaciones.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No se encontraron adjudicaciones</TableCell></TableRow>
                ) : (
                  adjudicaciones.map((adj) => (
                    <TableRow key={adj.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">{adj.identifier}</TableCell>
                      <TableCell className="font-medium">{adj.licitation?.callNumber || '-'}</TableCell>
                      <TableCell>{adj.licitation?.client?.name || '-'}</TableCell>
                      <TableCell>{new Date(adj.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(adj.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/licitaciones/${adj.licitationId}`}>
                          <Button variant="ghost" size="icon" title="Ver Licitación"><Eye className="h-4 w-4" /></Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Página {pagination.page} de {pagination.lastPage}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1 || loading}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.lastPage || loading}>Siguiente</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
