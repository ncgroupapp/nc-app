'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Boxes, Calculator, CircleDollarSign, FileCheck2, Receipt, Warehouse } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/common/fade-in'

import { stockService, formatMoney, StockSummary } from '@/services/stock.service'
import { cotizacionesService } from '@/services/cotizaciones.service'
import { Licitation, LicitationStatus } from '@/services/licitaciones.service'
import { QuotationStatus } from '@/types/enums'

const STATUS_ROWS: { status: LicitationStatus; label: string; color: string }[] = [
  { status: LicitationStatus.PENDING, label: 'En espera', color: 'bg-amber-400' },
  { status: LicitationStatus.QUOTED, label: 'Cotizada', color: 'bg-brand-blue' },
  { status: LicitationStatus.PARTIAL_ADJUDICATION, label: 'Adjudicación parcial', color: 'bg-brand-cyan' },
  { status: LicitationStatus.TOTAL_ADJUDICATION, label: 'Adjudicación total', color: 'bg-emerald-500' },
  { status: LicitationStatus.NOT_ADJUDICATED, label: 'No adjudicada', color: 'bg-red-400' },
  { status: LicitationStatus.CLOSED, label: 'Cerrada', color: 'bg-zinc-400' },
]

interface QuotationCounts {
  total: number
  finalized: number
}

interface BusinessMetricsProps {
  licitaciones: Licitation[]
  isLoadingLicitaciones: boolean
}

export function BusinessMetrics({ licitaciones, isLoadingLicitaciones }: BusinessMetricsProps) {
  const [stock, setStock] = useState<StockSummary | null>(null)
  const [quotations, setQuotations] = useState<QuotationCounts | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [stockRes, allQuotations, finalizedQuotations] = await Promise.all([
        stockService.getSummary().catch(() => null),
        cotizacionesService.getAll({ limit: 1 }).catch(() => null),
        cotizacionesService.getAll({ limit: 1, status: QuotationStatus.FINALIZED }).catch(() => null),
      ])
      if (cancelled) return
      setStock(stockRes)
      setQuotations(
        allQuotations
          ? { total: allQuotations.meta?.total ?? 0, finalized: finalizedQuotations?.meta?.total ?? 0 }
          : null,
      )
      setIsLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  const stockValue = stock && stock.valueByCurrency.length > 0
    ? stock.valueByCurrency.map((row) => formatMoney(row.value, row.currency)).join(' · ')
    : '—'
  const costCoverage = stock && stock.productsInStock > 0
    ? Math.round((stock.productsWithCost / stock.productsInStock) * 100)
    : 0

  const statusCounts = STATUS_ROWS.map((row) => ({
    ...row,
    count: licitaciones.filter((l) => l.status === row.status).length,
  })).filter((row) => row.count > 0)
  const maxStatusCount = Math.max(1, ...statusCounts.map((row) => row.count))

  return (
    <FadeIn delay={50}>
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">Métricas</h2>
            <p className="text-sm text-muted-foreground">Inventario, cotizaciones y licitaciones de un vistazo.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            href="/dashboard/stock"
            icon={CircleDollarSign}
            label="Valor del stock"
            value={stockValue}
            hint={stock ? `Con costo de última compra` : 'Sin datos'}
            isLoading={isLoading}
            highlight
          />
          <MetricCard
            href="/dashboard/stock"
            icon={Warehouse}
            label="Productos en stock"
            value={stock ? stock.productsInStock.toLocaleString('es-UY') : '—'}
            hint={stock ? `${stock.unitsInStock.toLocaleString('es-UY')} unidades` : 'Sin datos'}
            isLoading={isLoading}
          />
          <MetricCard
            href="/dashboard/stock"
            icon={Receipt}
            label="Costos cargados"
            value={stock ? `${costCoverage}%` : '—'}
            hint={stock ? `${stock.productsWithCost} de ${stock.productsInStock} productos` : 'Sin datos'}
            progress={stock ? costCoverage : undefined}
            isLoading={isLoading}
          />
          <MetricCard
            href="/dashboard/cotizaciones"
            icon={Calculator}
            label="Cotizaciones"
            value={quotations ? quotations.total.toLocaleString('es-UY') : '—'}
            hint={quotations ? `${quotations.finalized} ${quotations.finalized === 1 ? 'finalizada' : 'finalizadas'}` : 'Sin datos'}
            isLoading={isLoading}
          />
        </div>

        <Card className="border-zinc-200/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-brand-navy">
              <FileCheck2 className="h-4 w-4" />
              Licitaciones por estado
            </CardTitle>
            <CardDescription>Cantidad de procesos en cada etapa</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLicitaciones ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : statusCounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-sm text-muted-foreground">
                <Boxes className="mb-2 h-8 w-8 opacity-20" />
                Todavía no hay licitaciones registradas
              </div>
            ) : (
              <div className="space-y-3">
                {statusCounts.map((row) => (
                  <div key={row.status} className="grid grid-cols-[150px_1fr_32px] items-center gap-3 text-sm">
                    <span className="text-zinc-600">{row.label}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full ${row.color} transition-all duration-700`}
                        style={{ width: `${(row.count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-right font-bold text-brand-navy">{row.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  )
}

interface MetricCardProps {
  href: string
  icon: LucideIcon
  label: string
  value: string
  hint: string
  isLoading: boolean
  progress?: number
  highlight?: boolean
}

function MetricCard({ href, icon: Icon, label, value, hint, isLoading, progress, highlight }: MetricCardProps) {
  return (
    <Link href={href} className="group block">
      <Card
        className={`relative h-full overflow-hidden shadow-sm transition-shadow group-hover:shadow-md ${
          highlight ? 'border-brand-navy bg-brand-navy text-white' : 'border-zinc-200/60'
        }`}
      >
        {highlight && <span className="nc-brand-line absolute inset-x-0 bottom-0 h-1" aria-hidden="true" />}
        <CardContent className="py-1">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-white/70' : 'text-zinc-500'}`}>
              {label}
            </p>
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                highlight ? 'bg-white/10 text-brand-cyan' : 'bg-[#E8F2FA] text-brand-blue'
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className={`mt-2 h-8 w-32 ${highlight ? 'bg-white/20' : ''}`} />
          ) : (
            <p className={`mt-1 text-2xl font-extrabold leading-tight tracking-tight ${highlight ? 'text-white' : 'text-brand-navy'}`}>
              {value}
            </p>
          )}
          <p className={`mt-1 text-xs ${highlight ? 'text-white/70' : 'text-muted-foreground'}`}>{hint}</p>
          {progress !== undefined && !isLoading && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-brand-blue transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
