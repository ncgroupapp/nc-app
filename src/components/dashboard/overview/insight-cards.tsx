import Link from 'next/link'
import { AlertTriangle, ArrowRight, CalendarClock, Scale, Wallet } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AgendaItem, DashboardOverview, MoneyByCurrency } from '@/services/dashboard.service'
import { CountUp } from './count-up'
import { formatFullMoney } from './format'

function Head({ icon: Icon, title, subtitle, tone = 'blue' }: { icon: typeof Scale; title: string; subtitle: string; tone?: 'blue' | 'red' }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-bold">{title}</h2>
        <p className="text-[12.5px] text-muted-foreground">{subtitle}</p>
      </div>
      <span
        className={cn(
          'flex size-[34px] shrink-0 items-center justify-center rounded-[10px]',
          tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-[#EAF3FB] text-brand-blue',
        )}
      >
        <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
      </span>
    </div>
  )
}

/** "$ 112.210 + US$ 7.780", "$ 0" when there is nothing */
const bothCurrencies = (money: MoneyByCurrency) =>
  [money.UYU !== 0 && formatFullMoney(money.UYU), money.USD !== 0 && formatFullMoney(money.USD, 'USD')].filter(Boolean).join(' + ') ||
  formatFullMoney(0)

const shortDeadline = (value: string) => {
  const [day, time] = value.split(' ')
  const [, month, date] = day.split('-')
  return `${date}/${month} ${time}`
}

export function MissingOffersCard({ data }: { data: DashboardOverview['missingOffers'] }) {
  const none = data.products === 0
  return (
    <Card className="gap-2 rounded-2xl p-4 shadow-xs md:p-5">
      <Head icon={AlertTriangle} title="Ofertas por pedir" subtitle="Productos de licitaciones abiertas sin ninguna oferta" tone={none ? 'blue' : 'red'} />
      {none ? (
        <p className="text-2xl font-extrabold text-emerald-700">Todo cotizado</p>
      ) : (
        <>
          <p className="text-[26px] font-extrabold tracking-tight text-red-700">
            <CountUp value={data.products} format={(n) => String(Math.round(n))} /> {data.products === 1 ? 'producto' : 'productos'}
          </p>
          <p className="text-[12.5px] text-muted-foreground">
            en {data.licitations} {data.licitations === 1 ? 'licitación' : 'licitaciones'}
            {data.nextDeadline && ` · la próxima cierra ${shortDeadline(data.nextDeadline)}`}
          </p>
        </>
      )}
      <Link href="/dashboard/licitaciones" className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-blue hover:underline">
        Ver licitaciones <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </Card>
  )
}

/** `winRate`: share of quoted licitations that end up adjudicated, in % */
export function AtStakeCard({ data, winRate }: { data: DashboardOverview['atStake']; winRate: number | null }) {
  return (
    <Card className="gap-2 rounded-2xl p-4 shadow-xs md:p-5">
      <Head icon={Scale} title="Monto en juego" subtitle="Cotizaciones enviadas que esperan adjudicación (c/IVA)" />
      <p className="text-[26px] font-extrabold tracking-tight">
        <CountUp value={data.UYU} format={(n) => formatFullMoney(n)} />
        {data.USD !== 0 && (
          <span className="ml-2 text-base font-semibold text-muted-foreground">
            + <CountUp value={data.USD} format={(n) => formatFullMoney(n, 'USD')} />
          </span>
        )}
      </p>
      <p className="text-[12.5px] text-muted-foreground">
        {data.quotations} {data.quotations === 1 ? 'cotización' : 'cotizaciones'}
        {winRate !== null &&
          data.UYU > 0 &&
          ` · si ganamos ${Math.round(winRate / 10)} de cada 10 serían ≈ ${formatFullMoney(Math.round((data.UYU * winRate) / 100 / 1000) * 1000)}`}
      </p>
    </Card>
  )
}

const STATE_STYLE: Record<AgendaItem['state'], { dot: string; chip: string; label: (item: AgendaItem) => string }> = {
  ready: { dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-800', label: () => 'Lista' },
  missing_offers: {
    dot: 'bg-red-500',
    chip: 'bg-red-100 text-red-700',
    label: (item) => `${item.missingOffers} sin oferta`,
  },
  unfinished: { dot: 'bg-amber-500', chip: 'bg-amber-100 text-amber-800', label: () => 'Sin finalizar' },
  no_quotation: { dot: 'bg-red-500', chip: 'bg-red-100 text-red-700', label: () => 'Sin cotización' },
}

const dayHeading = (isoDay: string, today: string) => {
  const [year, month, day] = isoDay.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const name = date.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric' })
  const [ty, tm, td] = today.split('-').map(Number)
  const diff = Math.round((date.getTime() - new Date(ty, tm - 1, td).getTime()) / 86_400_000)
  const prefix = diff === 0 ? 'Hoy · ' : diff === 1 ? 'Mañana · ' : ''
  return `${prefix}${name}`.toUpperCase()
}

export function AgendaCard({ items, today }: { items: AgendaItem[]; today: string }) {
  const atRisk = items.filter((item) => item.state !== 'ready').length
  const days = [...new Set(items.map((item) => item.deadlineDay))]
  return (
    <Card className="gap-0 rounded-2xl p-4 shadow-xs md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold">Próximos cierres</h2>
          <p className="text-[12.5px] text-muted-foreground">Licitaciones abiertas de los próximos 7 días</p>
        </div>
        {atRisk > 0 ? (
          <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{atRisk} con pendientes</span>
        ) : (
          <CalendarClock className="h-5 w-5 text-brand-blue" aria-hidden="true" />
        )}
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No hay cierres en los próximos 7 días.</p>
      ) : (
        days.map((day) => {
          const ofDay = items.filter((item) => item.deadlineDay === day)
          return (
            <div key={day} className="mt-3">
              <p className="mb-1 flex justify-between text-[11px] font-semibold tracking-wide text-muted-foreground">
                <span>{dayHeading(day, today)}</span>
                <span>
                  {ofDay.length} {ofDay.length === 1 ? 'cierre' : 'cierres'}
                </span>
              </p>
              <ul>
                {ofDay.map((item) => {
                  const style = STATE_STYLE[item.state]
                  return (
                    <li key={item.id} className="border-t first:border-t-0">
                      <Link
                        href={`/dashboard/licitaciones/${item.id}`}
                        className="grid grid-cols-[46px_10px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md px-1 py-2 text-[13px] transition-colors hover:bg-muted/50"
                      >
                        <span className="font-bold tabular-nums">{item.deadlineTime}</span>
                        <span className={cn('size-2 rounded-full', style.dot)} aria-hidden="true" />
                        <span className="truncate">
                          {item.clientName ?? 'Sin cliente'} · <span className="text-muted-foreground">{item.callNumber}</span>
                        </span>
                        <span className={cn('whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold', style.chip)}>{style.label(item)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })
      )}
    </Card>
  )
}

const BUCKETS = [
  { key: 'thisWeek', label: 'Vence esta semana', color: 'var(--brand-blue)' },
  { key: 'restOfMonth', label: 'Resto del mes', color: '#85B7EB' },
  { key: 'nextMonth', label: 'Mes que viene', color: '#B4B2A9' },
] as const

export function CollectionsCard({ data }: { data: DashboardOverview['collections'] }) {
  const thisMonth = { UYU: data.thisWeek.UYU + data.restOfMonth.UYU, USD: data.thisWeek.USD + data.restOfMonth.USD }
  const monthTotal = Math.max(thisMonth.UYU, 1)
  return (
    <Card className="gap-0 rounded-2xl p-4 shadow-xs md:p-5">
      <Head icon={Wallet} title="Cobros esperados" subtitle="Vencen a los 60 días hábiles de la fecha de factura" />
      <p className="mt-3 text-[12.5px] text-muted-foreground">Entra este mes</p>
      <p className="text-[26px] font-extrabold tracking-tight">
        <CountUp value={thisMonth.UYU} format={(n) => formatFullMoney(n)} />
        {thisMonth.USD !== 0 && (
          <span className="ml-2 text-base font-semibold text-muted-foreground">
            + <CountUp value={thisMonth.USD} format={(n) => formatFullMoney(n, 'USD')} />
          </span>
        )}
      </p>
      <div className="mb-2 mt-2.5 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="nc-fill h-full" style={{ width: `${(data.thisWeek.UYU / monthTotal) * 100}%`, background: 'var(--brand-blue)' }} />
        <div
          className="nc-fill h-full"
          style={{ width: `${(data.restOfMonth.UYU / monthTotal) * 100}%`, background: '#85B7EB', animationDelay: '200ms' }}
        />
      </div>
      <ul className="text-[13px]">
        {BUCKETS.map((bucket) => (
          <li key={bucket.key} className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2 border-t py-2">
            <span className="size-2 rounded-full" style={{ background: bucket.color }} aria-hidden="true" />
            <span>
              {bucket.label} · <span className="text-muted-foreground">{data[bucket.key].invoices} facturas</span>
            </span>
            <b className="font-semibold tabular-nums">{bothCurrencies(data[bucket.key])}</b>
          </li>
        ))}
        <li className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2 border-t py-2 text-red-700">
          <span className="size-2 rounded-full bg-red-500" aria-hidden="true" />
          <span>Vencidas sin cobrar · {data.overdue.invoices} facturas</span>
          <b className="font-semibold tabular-nums">{bothCurrencies(data.overdue)}</b>
        </li>
      </ul>
      <Link href="/dashboard/facturacion" className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-blue hover:underline">
        Marcar cobradas en Facturación <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </Card>
  )
}
