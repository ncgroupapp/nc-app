'use client'

import { useEffect, useCallback, useState } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, FileText, Package, Truck, AlertCircle } from "lucide-react";
import { FadeIn } from "@/components/common/fade-in";
import { licitacionesService, Licitation, LicitationStatus } from "@/services/licitaciones.service";

export default function DashboardPage() {
  const [licitaciones, setLicitaciones] = useState<Licitation[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await licitacionesService.getAll({ page: 1 })
      setLicitaciones(res.data ?? [])
      setTotal(res.meta?.total ?? 0)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('No se pudieron cargar los datos. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Derive stats from real data
  const licitacionesActivas = licitaciones.filter(
    (l) => l.status === LicitationStatus.PENDING || l.status === LicitationStatus.QUOTED
  ).length
  const recentLicitaciones = licitaciones.slice(0, 5)

  const getEstadoVariant = (status: LicitationStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case LicitationStatus.PENDING: return "secondary";
      case LicitationStatus.QUOTED: return "default";
      case LicitationStatus.TOTAL_ADJUDICATION: return "outline";
      case LicitationStatus.NOT_ADJUDICATED: return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del sistema de gestión de licitaciones
        </p>
      </FadeIn>

      {error && (
        <FadeIn direction="none">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </FadeIn>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FadeIn delay={100}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Licitaciones</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{total}</div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={200}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Licitaciones Activas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{licitacionesActivas}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">En proceso actualmente</p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={300}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mt-2">
                <Link href="/dashboard/proveedores" className="underline underline-offset-2 hover:text-foreground">
                  Ver listado completo
                </Link>
              </p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={400}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mt-2">
                <Link href="/dashboard/clientes" className="underline underline-offset-2 hover:text-foreground">
                  Ver listado completo
                </Link>
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={500}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Licitaciones Recientes</CardTitle>
              <Link
                href="/dashboard/licitaciones"
                className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Ver todas
              </Link>
            </div>
            <CardDescription>Últimas licitaciones registradas en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))
              ) : recentLicitaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay licitaciones registradas
                </p>
              ) : (
                recentLicitaciones.map((licitacion) => (
                  <Link
                    key={licitacion.id}
                    href={`/dashboard/licitaciones/${licitacion.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{licitacion.callNumber}</p>
                      <p className="text-xs text-muted-foreground">{licitacion.client?.name ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(licitacion.startDate).toLocaleDateString('es-CL')}
                      </span>
                      <Badge variant={getEstadoVariant(licitacion.status)}>
                        {licitacion.status}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={600}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" aria-hidden="true" />
              Módulos adicionales
            </CardTitle>
            <CardDescription>Accesos directos a otras secciones del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Adjudicaciones', href: '/dashboard/adjudicaciones' },
                { label: 'Cotizaciones', href: '/dashboard/cotizaciones' },
                { label: 'Productos', href: '/dashboard/productos' },
                { label: 'Marcas', href: '/dashboard/marcas' },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted transition-colors px-3 py-1">
                    {item.label}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
