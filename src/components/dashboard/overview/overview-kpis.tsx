import { CircleDollarSign, FileText, Target, TrendingUp, type LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DashboardOverview } from '@/services/dashboard.service'
import { formatCompactMoney, percentChange } from './format'
import { Sparkline } from './sparkline'

interface TileProps {
  label: string
  icon: LucideIcon
  value: string
  children: React.ReactNode
}

function Tile({ label, icon: Icon, value, children }: TileProps) {
  return (
    <Card className="gap-1.5 rounded-2xl p-4 shadow-xs md:p-[18px]">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
        <span className="hidden size-[34px] items-center justify-center rounded-[10px] bg-[#EAF3FB] text-brand-blue md:flex">
          <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
        </span>
      </div>
      <p className="text-[21px] font-extrabold tracking-tight md:text-[26px]">{value}</p>
      {children}
    </Card>
  )
}

function Delta({ value, suffix }: { value: number | null; suffix: string }) {
  if (value === null) return <span className="text-xs text-muted-foreground">Sin datos para comparar</span>
  return (
    <p className="text-xs text-muted-foreground">
      <span className={cn('font-semibold', value >= 0 ? 'text-emerald-700' : 'text-red-700')}>
        {value >= 0 ? '▲' : '▼'} {Math.abs(value)}
        {suffix}
      </span>{' '}
      vs. período anterior
    </p>
  )
}

/** The four headline numbers with their trend. */
export function OverviewKpis({ data }: { data: DashboardOverview }) {
  const { billing, licitations, margin } = data
  const rate = licitations.adjudicationRate
  const rateDelta =
    rate !== null && licitations.adjudicationRatePrevious !== null
      ? Math.round((rate - licitations.adjudicationRatePrevious) * 10) / 10
      : null

  return (
    <section className="grid grid-cols-2 gap-2.5 md:gap-4 xl:grid-cols-4">
      <Tile label="Facturado neto (mes)" icon={CircleDollarSign} value={formatCompactMoney(billing.thisMonth.UYU)}>
        <Delta value={percentChange(billing.thisMonth.UYU, billing.lastMonth.UYU)} suffix="%" />
        <Sparkline values={billing.monthly.map((m) => m.UYU)} area label="Facturación neta de los últimos 12 meses" />
      </Tile>
      <Tile label="Licitaciones activas" icon={FileText} value={String(licitations.active)}>
        <p className="text-xs text-muted-foreground">
          {licitations.closingToday > 0 && <span className="font-semibold text-red-700">{licitations.closingToday} cierran hoy · </span>}
          {licitations.closingThisWeek} en 7 días
        </p>
        <Sparkline values={licitations.createdMonthly} label="Licitaciones recibidas por mes" />
      </Tile>
      <Tile label="Tasa de adjudicación" icon={Target} value={rate === null ? '—' : `${rate.toLocaleString('es-UY')}%`}>
        {rate === null ? (
          <p className="text-xs text-muted-foreground">Sin licitaciones resueltas en 90 días</p>
        ) : (
          <Delta value={rateDelta} suffix=" pts" />
        )}
        <p className="text-[11px] text-muted-foreground">Últimos 90 días</p>
      </Tile>
      <Tile
        label="Margen promedio"
        icon={TrendingUp}
        value={margin.last90Days === null ? '—' : `${margin.last90Days.toLocaleString('es-UY', { maximumFractionDigits: 1 })}%`}
      >
        <p className="text-xs text-muted-foreground">
          {margin.last90Days === null ? 'Faltan costos en las cotizaciones' : `Mínimo esperado ${margin.minMargin}%`}
        </p>
        {margin.last90Days !== null && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className={cn('h-full rounded-full', margin.last90Days >= margin.minMargin ? 'bg-brand-blue' : 'bg-red-500')}
              style={{ width: `${Math.min(100, Math.max(4, (margin.last90Days / Math.max(margin.minMargin * 2, 1)) * 100))}%` }}
            />
          </div>
        )}
      </Tile>
    </section>
  )
}
