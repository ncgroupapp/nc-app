import { Percent, TrendingUp, Truck } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { CountUp } from '@/components/dashboard/overview/count-up'
import { cn } from '@/lib/utils'
import { ProfitabilityLicitation, ProfitabilityReport } from '@/services/rentabilidad.service'

/** Margin bands of the traffic light, in % */
export const MARGIN_GOOD = 30
export const MARGIN_LOW = 15

const amount = (value: number, decimals = 0) =>
  value.toLocaleString('es-UY', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
const pct = (value: number | null) =>
  value === null ? '—' : `${value.toLocaleString('es-UY', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`

/** Profit / sale of a group of licitations, in % */
const marginOf = (rows: ProfitabilityLicitation[]) => {
  const sale = rows.reduce((sum, l) => sum + l.costedSaleUsd, 0)
  return sale > 0 ? (rows.reduce((sum, l) => sum + l.profitUsd, 0) / sale) * 100 : null
}

export const marginTone = (margin: number | null) =>
  margin === null ? 'none' : margin >= MARGIN_GOOD ? 'good' : margin >= MARGIN_LOW ? 'mid' : 'low'

const TONE_TEXT = { good: 'text-emerald-700', mid: 'text-amber-700', low: 'text-red-700', none: 'text-muted-foreground' } as const

function Panel({ title, subtitle, children, className }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('gap-0 py-0 shadow-sm', className)}>
      <CardContent className="p-4 md:p-5">
        <h2 className="text-[15px] font-bold">{title}</h2>
        <p className="mb-3 text-[12.5px] text-muted-foreground">{subtitle}</p>
        {children}
      </CardContent>
    </Card>
  )
}

const KPI_TONES = {
  blue: { card: 'border-blue-200 bg-blue-50/70', icon: 'bg-brand-blue', value: 'text-brand-navy', label: 'text-blue-900/70' },
  slate: { card: 'border-slate-200 bg-slate-50', icon: 'bg-slate-500', value: 'text-slate-800', label: 'text-slate-600' },
  green: { card: 'border-emerald-200 bg-emerald-50/70', icon: 'bg-emerald-600', value: 'text-emerald-900', label: 'text-emerald-900/70' },
  violet: { card: 'border-violet-200 bg-violet-50/70', icon: 'bg-violet-600', value: 'text-violet-950', label: 'text-violet-900/70' },
  red: { card: 'border-red-200 bg-red-50/70', icon: 'bg-red-600', value: 'text-red-800', label: 'text-red-900/70' },
} as const

function Kpi({ label, value, hint, icon, tone }: { label: string; value: React.ReactNode; hint: string; icon: React.ReactNode; tone: keyof typeof KPI_TONES }) {
  const style = KPI_TONES[tone]
  return (
    <Card className={cn('h-full gap-0 py-0 shadow-sm', style.card)}>
      <CardContent className="flex items-center gap-3.5 p-4">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm', style.icon)}>{icon}</div>
        <div className="min-w-0">
          <p className={cn('text-sm font-medium', style.label)}>{label}</p>
          <p className={cn('whitespace-nowrap text-2xl font-extrabold leading-tight tracking-tight tabular-nums', style.value)}>{value}</p>
          <p className={cn('text-xs leading-snug', style.label)}>{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProfitabilityKpis({ report, minMargin }: { report: ProfitabilityReport; minMargin: number }) {
  const { summary } = report
  const marginBad = summary.margin !== null && summary.margin < minMargin
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Monto ofertado"
        tone="blue"
        icon={<span className="text-sm font-extrabold tracking-wide">USD</span>}
        value={<CountUp value={summary.offeredUsd} format={(n) => amount(n, 2)} />}
        hint={`${summary.licitations} ${summary.licitations === 1 ? 'licitación' : 'licitaciones'}`}
      />
      <Kpi
        label="Costo"
        tone="slate"
        icon={<Truck className="h-6 w-6" aria-hidden="true" />}
        value={<CountUp value={summary.costUsd} format={(n) => amount(n, 2)} />}
        hint="USD, de las ofertas elegidas"
      />
      <Kpi
        label="Ganancia estimada"
        tone="green"
        icon={<TrendingUp className="h-6 w-6" aria-hidden="true" />}
        value={<CountUp value={summary.profitUsd} format={(n) => amount(n, 2)} />}
        hint={summary.itemsWithoutOffer ? `USD · ${summary.itemsWithoutOffer} ${summary.itemsWithoutOffer === 1 ? 'ítem sin oferta no cuenta' : 'ítems sin oferta no cuentan'}` : 'USD, sobre ítems con oferta'}
      />
      <Kpi
        label="Margen promedio"
        tone={marginBad ? 'red' : 'violet'}
        icon={<Percent className="h-6 w-6" aria-hidden="true" />}
        value={summary.margin === null ? '—' : <CountUp value={summary.margin} format={(n) => pct(n)} />}
        hint={`Markup ${pct(summary.markup)}`}
      />
    </div>
  )
}

/** Profit already won (adjudicated) against profit that depends on the award (presented) */
function SecuredVsAtStake({ rows }: { rows: ProfitabilityLicitation[] }) {
  const won = rows.filter((l) => l.status === 'adjudicada')
  const pending = rows.filter((l) => l.status === 'presentada')
  const wonProfit = won.reduce((sum, l) => sum + l.profitUsd, 0)
  const pendingProfit = pending.reduce((sum, l) => sum + l.profitUsd, 0)
  const total = Math.max(wonProfit + pendingProfit, 1)
  return (
    <Panel title="Ganancia asegurada vs. en juego" subtitle="Lo adjudicado ya es ganancia; lo presentado depende de la adjudicación">
      <div className="flex h-3.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="nc-fill h-full bg-emerald-700" style={{ width: `${(wonProfit / total) * 100}%` }} />
        <div className="nc-fill h-full bg-emerald-400" style={{ width: `${(pendingProfit / total) * 100}%`, animationDelay: '200ms' }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
        <div>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <i className="inline-block size-2.5 rounded-sm bg-emerald-700" /> Asegurada · {won.length} {won.length === 1 ? 'adjudicada' : 'adjudicadas'}
          </p>
          <p className="text-lg font-extrabold text-emerald-800 tabular-nums">
            USD {amount(wonProfit)} <span className="text-xs font-medium text-muted-foreground">· margen {pct(marginOf(won))}</span>
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <i className="inline-block size-2.5 rounded-sm bg-emerald-400" /> En juego · {pending.length} {pending.length === 1 ? 'presentada' : 'presentadas'}
          </p>
          <p className="text-lg font-extrabold text-emerald-700 tabular-nums">
            USD {amount(pendingProfit)} <span className="text-xs font-medium text-muted-foreground">· margen {pct(marginOf(pending))}</span>
          </p>
        </div>
      </div>
    </Panel>
  )
}

/** How many licitations fall in each margin band */
function MarginTrafficLight({ rows }: { rows: ProfitabilityLicitation[] }) {
  const count = (tone: ReturnType<typeof marginTone>) => rows.filter((l) => marginTone(l.margin) === tone).length
  const cells = [
    { tone: 'good', label: `${MARGIN_GOOD} % o más`, className: 'bg-emerald-50 text-emerald-800' },
    { tone: 'mid', label: `${MARGIN_LOW} a ${MARGIN_GOOD} %`, className: 'bg-amber-50 text-amber-800' },
    { tone: 'low', label: `menos de ${MARGIN_LOW} %`, className: 'bg-red-50 text-red-700' },
    { tone: 'none', label: 'sin costo', className: 'bg-muted text-muted-foreground' },
  ] as const
  return (
    <Panel title="Semáforo de márgenes" subtitle="Cuántas licitaciones caen en cada rango">
      <div className="grid grid-cols-4 gap-2 text-center">
        {cells.map((cell) => (
          <div key={cell.tone} className={cn('rounded-xl px-1 py-3', cell.className)}>
            <p className="text-2xl font-extrabold tabular-nums">{count(cell.tone)}</p>
            <p className="text-[11px] font-medium">{cell.label}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** Profit per month the licitation started, last 6 months with data */
function ProfitByMonth({ rows }: { rows: ProfitabilityLicitation[] }) {
  const byMonth = new Map<string, ProfitabilityLicitation[]>()
  for (const l of rows) {
    const key = l.startDate.slice(0, 7)
    byMonth.set(key, [...(byMonth.get(key) ?? []), l])
  }
  const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
  const profits = months.map(([, ls]) => ls.reduce((sum, l) => sum + l.profitUsd, 0))
  const max = Math.max(...profits, 1)
  return (
    <Panel title="Ganancia por mes" subtitle="Según el inicio de la licitación · USD">
      {months.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para estos filtros.</p>
      ) : (
        <div className="flex h-40 items-end gap-3 border-b px-2">
          {months.map(([key], i) => (
            <div key={key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-bold tabular-nums">{amount(profits[i])}</span>
              <div
                className={cn('nc-bar w-full max-w-14 rounded-t-md', i === months.length - 1 ? 'bg-emerald-400' : 'bg-emerald-700')}
                style={{ height: `${Math.max((profits[i] / max) * 100, 2)}%`, animationDelay: `${i * 80}ms` }}
              />
              <span className="sr-only">{key}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-1.5 flex gap-3 px-2">
        {months.map(([key, ls]) => (
          <span key={key} className="flex-1 text-center text-[11px] text-muted-foreground">
            {MONTHS[Number(key.slice(5, 7)) - 1]} · <span className={TONE_TEXT[marginTone(marginOf(ls))]}>{pct(marginOf(ls))}</span>
          </span>
        ))}
      </div>
    </Panel>
  )
}

/** Clients that leave the most profit, with their average margin */
function TopClients({ rows }: { rows: ProfitabilityLicitation[] }) {
  const byClient = new Map<string, ProfitabilityLicitation[]>()
  for (const l of rows) {
    const name = l.clientName.trim()
    byClient.set(name, [...(byClient.get(name) ?? []), l])
  }
  const top = [...byClient.entries()]
    .map(([name, ls]) => ({ name, profit: ls.reduce((sum, l) => sum + l.profitUsd, 0), margin: marginOf(ls) }))
    .filter((c) => c.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5)
  const max = Math.max(...top.map((c) => c.profit), 1)
  return (
    <Panel title="Clientes que más ganancia dejan" subtitle="Ganancia estimada y margen promedio">
      {top.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para estos filtros.</p>
      ) : (
        <div className="space-y-2">
          {top.map((client, i) => (
            <div key={client.name} className="grid grid-cols-[minmax(0,170px)_1fr_auto] items-center gap-3 text-[13px]">
              <span className="truncate" title={client.name}>{client.name}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="nc-fill block h-full rounded-full"
                  style={{ width: `${(client.profit / max) * 100}%`, background: i < 2 ? 'var(--brand-blue)' : '#85B7EB', animationDelay: `${i * 100}ms` }}
                />
              </span>
              <span className="whitespace-nowrap text-right tabular-nums">
                USD {amount(client.profit)} · <b className={cn('font-semibold', TONE_TEXT[marginTone(client.margin)])}>{pct(client.margin)}</b>
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

/** Providers whose offers left the most profit in the quoted items */
function TopProviders({ rows }: { rows: ProfitabilityLicitation[] }) {
  const byProvider = new Map<string, number>()
  for (const l of rows) {
    for (const item of l.items) {
      if (item.profitUsd === null || !item.providerName) continue
      byProvider.set(item.providerName, (byProvider.get(item.providerName) ?? 0) + item.profitUsd)
    }
  }
  const top = [...byProvider.entries()].filter(([, profit]) => profit > 0).sort((a, b) => b[1] - a[1]).slice(0, 5)
  if (top.length === 0) return null
  return (
    <Panel title="Proveedores que más ganancia nos dejan" subtitle="Ganancia de los ítems cotizados con su oferta · USD">
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {top.map(([name, profit]) => (
          <div key={name} className="min-w-0 rounded-xl bg-muted/60 px-3 py-2.5">
            <p className="truncate text-xs text-muted-foreground" title={name}>{name}</p>
            <p className="text-lg font-extrabold tabular-nums">{amount(profit)}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/** The analysis panels under the KPIs, computed from the licitations the filters return */
export function ProfitabilityInsights({ rows }: { rows: ProfitabilityLicitation[] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <SecuredVsAtStake rows={rows} />
        <MarginTrafficLight rows={rows} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <ProfitByMonth rows={rows} />
        <TopClients rows={rows} />
      </div>
      <TopProviders rows={rows} />
    </div>
  )
}
