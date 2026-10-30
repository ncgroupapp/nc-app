import Link from 'next/link'
import { ArrowRight, Inbox, Plus } from 'lucide-react'

import { DashboardOverview } from '@/services/dashboard.service'
import { formatFullMoney, formatLongDay, percentChange, timeAgo } from './format'

/** Greeting banner: what was billed this month and the request inbox. */
export function OverviewHero({ data }: { data: DashboardOverview }) {
  const { billing, licitations, solicitudes } = data
  const change = percentChange(billing.thisMonth.UYU, billing.lastMonth.UYU)
  const senders = [...new Set(solicitudes.latest.filter((s) => s.status === 'nueva').map((s) => s.fromName || s.fromEmail).filter(Boolean))]
  const pending = solicitudes.new

  const facts = [
    `${billing.thisMonth.invoices} ${billing.thisMonth.invoices === 1 ? 'factura emitida' : 'facturas emitidas'}`,
    licitations.closingToday > 0 && `${licitations.closingToday} ${licitations.closingToday === 1 ? 'licitación cierra' : 'licitaciones cierran'} hoy`,
    pending > 0 && `${pending} ${pending === 1 ? 'solicitud nueva' : 'solicitudes nuevas'} para responder`,
  ].filter(Boolean) as string[]
  const sentence = facts.length > 1 ? `${facts.slice(0, -1).join(', ')} y ${facts[facts.length - 1]}.` : `${facts[0]}.`

  return (
    <section
      className="relative grid grid-cols-1 gap-6 overflow-hidden rounded-[20px] p-5 text-white md:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
      style={{ background: 'linear-gradient(115deg, var(--brand-cyan) 0%, var(--brand-blue) 42%, var(--brand-navy) 100%)' }}
    >
      <div
        className="pointer-events-none absolute -bottom-36 -right-20 size-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,.18), transparent 65%)' }}
        aria-hidden="true"
      />
      <div className="relative min-w-0">
        <p className="text-sm font-medium text-white/85">{formatLongDay(data.today)} · Buen día, equipo</p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight md:text-3xl">
          Este mes facturaste <span className="text-[#BFF4F7]">{formatFullMoney(billing.thisMonth.UYU)}</span>
          {billing.thisMonth.USD !== 0 && <span className="text-[#BFF4F7]"> + {formatFullMoney(billing.thisMonth.USD, 'USD')}</span>}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90 md:text-[15px]">
          {change !== null && (
            <span className="mr-2 inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
              {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% vs. mes anterior
            </span>
          )}
          {sentence}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/licitaciones?nueva=1"
            className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy shadow-sm hover:bg-white/90 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Nueva licitación
          </Link>
          <Link
            href="/dashboard/licitaciones"
            className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[10px] bg-white/15 px-4 py-2.5 text-sm font-semibold text-white outline outline-1 outline-white/35 hover:bg-white/25 sm:flex-none"
          >
            Ver licitaciones
          </Link>
        </div>
      </div>

      <Link
        href="/dashboard/solicitudes"
        className="relative block min-w-0 rounded-2xl border border-white/30 bg-white/12 p-4 backdrop-blur-sm transition-colors hover:bg-white/20 lg:w-72"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-navy">
            <Inbox className="h-5 w-5" aria-hidden="true" />
            {solicitudes.unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-cyan px-1 text-[11px] font-bold text-brand-navy">
                {solicitudes.unread}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold">
              {pending === 0 ? 'Bandeja al día' : `${pending} ${pending === 1 ? 'solicitud nueva' : 'solicitudes nuevas'}`}
            </p>
            <p className="text-xs text-white/85">
              {solicitudes.unread > 0 ? `${solicitudes.unread} sin leer` : 'Todo leído'}
              {solicitudes.lastReceivedAt && ` · última ${timeAgo(solicitudes.lastReceivedAt)}`}
            </p>
          </div>
        </div>
        {senders.length > 0 && (
          <p className="mt-3 truncate border-t border-white/20 pt-2.5 text-[13px] text-white/90">{senders.slice(0, 3).join(' · ')}</p>
        )}
        <p className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-[#BFF4F7]">
          Ver solicitudes <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </p>
      </Link>
    </section>
  )
}
