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
import {
  AlertTriangle,
  Clock,
  FileText,
  TrendingUp,
  Target,
  Zap,
  AlertCircle,
  ArrowUpRight,
  MoreHorizontal,
  Package,
  Truck
} from "lucide-react";
import { FadeIn } from "@/components/common/fade-in";
import { licitacionesService, Licitation, LicitationStatus } from "@/services/licitaciones.service";
import { adjudicacionesService, Adjudication } from "@/services/adjudicaciones.service";

export default function DashboardPage() {
  const [licitaciones, setLicitaciones] = useState<Licitation[]>([])
  const [adjudicaciones, setAdjudicaciones] = useState<Adjudication[]>([])
  const [totalLicitaciones, setTotalLicitaciones] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch data in parallel
      const [licitacionesRes, adjudicacionesRes] = await Promise.all([
        licitacionesService.getAll({ page: 1 }),
        adjudicacionesService.getAll({ limit: 50 }).catch(() => ({ data: [] }))
      ]);

      setLicitaciones(licitacionesRes.data ?? [])
      setTotalLicitaciones(licitacionesRes.meta?.total ?? 0)

      // Handle potential direct array response or paginated object
      const adjData = Array.isArray(adjudicacionesRes)
        ? adjudicacionesRes
        : (adjudicacionesRes as any).data || [];

      setAdjudicaciones(adjData)

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

  // --- Derived Calculations ---

  // Aggregate data for chart (Group by day)
  const chartData = adjudicaciones.reduce((acc: { date: string, total: number }[], adj) => {
    const date = adj.adjudicationDate ? new Date(adj.adjudicationDate).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' }) : 'Sin fecha';
    const price = typeof adj.totalPriceWithoutIVA === 'string'
      ? parseFloat(adj.totalPriceWithoutIVA)
      : (typeof adj.totalPriceWithoutIVA === 'number' ? adj.totalPriceWithoutIVA : 0);

    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.total += price;
    } else {
      acc.push({ date, total: price });
    }
    return acc;
  }, []).slice(-15); // Show last 15 unique days
  const pipelineTotal = adjudicaciones.reduce((acc, adj) => {
    const price = typeof adj.totalPriceWithoutIVA === 'string'
      ? parseFloat(adj.totalPriceWithoutIVA)
      : adj.totalPriceWithoutIVA;
    return acc + (price || 0);
  }, 0);

  // 2. Win Rate: Adjudicated licitations / Total
  const adjudicatedCount = licitaciones.filter(l =>
    l.status === LicitationStatus.TOTAL_ADJUDICATION ||
    l.status === LicitationStatus.PARTIAL_ADJUDICATION
  ).length;

  const winRate = totalLicitaciones > 0
    ? (adjudicatedCount / totalLicitaciones) * 100
    : 0;

  // 3. Urgent Closures: Licitations with deadline in the next 7 days
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const urgentLicitaciones = licitaciones
    .filter(l => {
      const deadline = new Date(l.deadlineDate);
      return deadline >= now && deadline <= nextWeek && l.status === LicitationStatus.PENDING;
    })
    .sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount);
  };

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
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">NC Group</h1>
          <p className="text-muted-foreground">
            Gestión estratégica y análisis de licitaciones en tiempo real.
          </p>
        </div>
      </FadeIn>

      {error && (
        <FadeIn direction="none">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </FadeIn>
      )}

      {/* 1. Módulos Hero (Fila 1 - KPIs) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Pipeline Module */}
        <div className="col-span-12 md:col-span-4">
          <FadeIn delay={100}>
            <Card className="overflow-hidden border-zinc-200/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Pipeline Adjudicado (Mes)
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  {isLoading ? (
                    <Skeleton className="h-9 w-32" />
                  ) : (
                    <div className="text-2xl font-bold font-mono tracking-tighter">
                      {formatCurrency(pipelineTotal)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>Calculado de adjudicaciones</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Win Rate Module */}
        <div className="col-span-12 md:col-span-4">
          <FadeIn delay={200}>
            <Card className="overflow-hidden border-zinc-200/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Tasa de Éxito (Win Rate)
                </CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  {isLoading ? (
                    <Skeleton className="h-9 w-24" />
                  ) : (
                    <div className="text-3xl font-bold font-mono tracking-tighter">
                      {winRate.toFixed(1)}%
                    </div>
                  )}
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-blue-500 h-full transition-all duration-1000"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Opportunities Module */}
        <div className="col-span-12 md:col-span-4">
          <FadeIn delay={300}>
            <Card className="overflow-hidden border-zinc-200/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total Licitaciones
                </CardTitle>
                <Zap className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  {isLoading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    <div className="text-3xl font-bold font-mono tracking-tighter">
                      {totalLicitaciones}
                    </div>
                  )}
                  <div className="text-xs text-zinc-500">
                    Procesos registrados en sistema
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* 2. Operación y Urgencia (Fila 2) */}
        <div className="col-span-12 lg:col-span-8">
          <FadeIn delay={400}>
            <Card className="h-full border-zinc-200/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Próximos Cierres</CardTitle>
                  <CardDescription>Licitaciones pendientes por vencer (7 días)</CardDescription>
                </div>
                <Link href="/dashboard/licitaciones">
                  <Badge variant="outline" className="font-normal cursor-pointer hover:bg-zinc-50">Ver todas</Badge>
                </Link>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))
                  ) : urgentLicitaciones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <FileText className="h-10 w-10 text-zinc-200 mb-2" />
                      <p className="text-zinc-500 text-sm">No hay cierres críticos en los próximos 7 días</p>
                    </div>
                  ) : (
                    urgentLicitaciones.map((licitacion) => {
                      const daysLeft = Math.ceil((new Date(licitacion.deadlineDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const isCritical = daysLeft <= 2;

                      return (
                        <Link
                          key={licitacion.id}
                          href={`/dashboard/licitaciones/${licitacion.id}`}
                          className="group relative flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isCritical ? 'bg-amber-50 text-amber-600' : 'bg-zinc-50 text-zinc-600'} group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors`}>
                              <Clock className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-zinc-900 line-clamp-1">{licitacion.callNumber}</h4>
                              <p className="text-xs text-zinc-500">{licitacion.client?.name ?? 'Cliente no especificado'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="hidden md:flex flex-col items-end text-right">
                              <span className={`text-xs font-mono font-medium ${isCritical ? 'text-amber-600' : 'text-zinc-900'}`}>
                                {daysLeft === 0 ? 'Cierra hoy' : `En ${daysLeft} días`}
                              </span>
                              <span className="text-[10px] text-zinc-400 uppercase">
                                {new Date(licitacion.deadlineDate).toLocaleDateString('es-CL')}
                              </span>
                            </div>
                            <Badge variant={getEstadoVariant(licitacion.status)} className="capitalize px-2 py-0 text-[10px]">
                              {licitacion.status}
                            </Badge>
                          </div>
                        </Link>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Acciones Pendientes (Fila 2 - Lado Derecho) */}
        <div className="col-span-12 lg:col-span-4">
          <FadeIn delay={500}>
            <Card className="h-full border-zinc-200/60 shadow-sm bg-zinc-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Alertas de Gestión
                </CardTitle>
                <CardDescription>Acciones basadas en datos actuales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {totalLicitaciones > 0 && licitaciones.filter(l => l.status === LicitationStatus.PENDING).length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-zinc-200 shadow-sm">
                      <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-zinc-900">Licitaciones por cotizar</p>
                        <p className="text-[11px] text-zinc-500">Tienes {licitaciones.filter(l => l.status === LicitationStatus.PENDING).length} licitaciones que requieren cotización.</p>
                      </div>
                    </div>
                  )}

                  {adjudicaciones.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-zinc-200 shadow-sm">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-zinc-900">Nuevas Adjudicaciones</p>
                        <p className="text-[11px] text-zinc-500">Se han registrado {adjudicaciones.length} adjudicaciones recientemente.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-200">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Accesos Rápidos</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/dashboard/productos" className="flex flex-col items-center justify-center p-3 bg-white border border-zinc-200 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-all">
                      <Package className="h-4 w-4 mb-1" />
                      <span className="text-[10px] font-medium">Catálogo</span>
                    </Link>
                    <Link href="/dashboard/proveedores" className="flex flex-col items-center justify-center p-3 bg-white border border-zinc-200 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-all">
                      <Truck className="h-4 w-4 mb-1" />
                      <span className="text-[10px] font-medium">Proveedores</span>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* 3. Análisis Mensual (Fila 3) */}
        <div className="col-span-12">
          <FadeIn delay={600}>
            <Card className="border-zinc-200/60 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Volumen Adjudicado</CardTitle>
                  <CardDescription>Rendimiento basado en las últimas 50 adjudicaciones</CardDescription>
                </div>
                <button className="p-2 hover:bg-zinc-100 rounded-md transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="h-[200px] flex items-end gap-2 pt-10 px-6">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : adjudicaciones.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                    <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-xs">No hay datos de adjudicaciones para graficar</p>
                  </div>
                ) : (
                  // Daily aggregated visualization
                  chartData.map((data, i) => {
                    const price = data.total;
                    const maxHeight = Math.max(...chartData.map(d => d.total), 1);
                    const height = (price / maxHeight) * 100;

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 text-center">
                          <span className="text-[8px] font-bold bg-zinc-900 text-white px-1 rounded-sm whitespace-nowrap">
                            {price > 1000000 ? `${(price / 1000000).toFixed(1)}M` : `${(price / 1000).toFixed(0)}k`}
                          </span>
                        </div>
                        <div
                          className="w-full bg-blue-100 rounded-t-sm group-hover:bg-blue-600 transition-all duration-300 min-h-[4px]"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`Total ${data.date}: ${formatCurrency(price)}`}
                        />
                        <span className="text-[8px] text-zinc-400 font-mono overflow-hidden whitespace-nowrap">
                          {data.date}
                        </span>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
