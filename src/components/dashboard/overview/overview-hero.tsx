'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Inbox, Plus } from 'lucide-react'

import { DashboardOverview } from '@/services/dashboard.service'
import { CountUp } from './count-up'
import { HeroTicker } from './hero-ticker'
import { formatFullMoney, formatLongDay, percentChange, timeAgo } from './format'

const nowInUruguay = () =>
  new Date().toLocaleTimeString('es-UY', { timeZone: 'America/Montevideo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** "EN VIVO 14:32": pulsing dot and a clock that keeps ticking. */
function LiveClock() {
  const [time, setTime] = useState<string | null>(null)
  useEffect(() => {
    setTime(nowInUruguay())
    const timer = setInterval(() => setTime(nowInUruguay()), 15_000)
    return () => clearInterval(timer)
  }, [])
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-[#9FD8EA]">
      <span className="nc-live-dot size-2 rounded-full bg-emerald-400" aria-hidden="true" />
      EN VIVO{time && <span className="tabular-nums tracking-normal text-white/70">{time}</span>}
    </span>
  )
}

/** Greeting banner: what was billed this month, the request inbox and a band with today's news. */
export function OverviewHero({ data }: { data: DashboardOverview }) {
  const { billing, licitations, solicitudes } = data
  const change = percentChange(billing.thisMonth.UYU, billing.lastMonth.UYU)
  const senders = [...new Set(solicitudes.latest.filter((s) => s.status === 'nueva').map((s) => s.fromName || s.fromEmail).filter(Boolean))]
  const pending = solicitudes.new

  const facts = [
    { value: billing.thisMonth.invoices, label: billing.thisMonth.invoices === 1 ? 'factura emitida' : 'facturas emitidas' },
    { value: licitations.closingToday, label: licitations.closingToday === 1 ? 'licitación cierra hoy' : 'licitaciones cierran hoy' },
    { value: pending, label: pending === 1 ? 'solicitud por responder' : 'solicitudes por responder' },
  ]

  return (
    <section
      className="relative overflow-hidden rounded-[20px] text-white shadow-sm"
      style={{ background: 'linear-gradient(120deg, #15203A 0%, var(--brand-navy) 45%, #17335F 100%)' }}
    >
      <div className="nc-sweep absolute inset-x-0 top-0 h-[3px]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-24 -top-28 size-[26rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(80,210,220,.16), transparent 62%)' }}
        aria-hidden="true"
      />

      <div className="relative grid grid-cols-1 gap-6 p-5 md:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-[#AFC0DA]">{formatLongDay(data.today)} · NC Group SAS</p>
            <LiveClock />
          </div>
          <p className="mt-4 text-[13px] font-medium uppercase tracking-[0.08em] text-[#AFC0DA]">Facturación neta del mes</p>
          <h1 className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl font-extrabold tracking-tight md:text-[40px]">
            <CountUp value={billing.thisMonth.UYU} format={(n) => formatFullMoney(n)} />
            {billing.thisMonth.USD !== 0 && (
              <span className="text-xl font-bold text-[#9FD8EA] md:text-2xl">
                + <CountUp value={billing.thisMonth.USD} format={(n) => formatFullMoney(n, 'USD')} />
              </span>
            )}
            {change !== null && (
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${change >= 0 ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'}`}
              >
                {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% vs. mes anterior
              </span>
            )}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-[#C9D3E6]">
            {facts.map((fact) => (
              <span key={fact.label}>
                <b className="text-base font-bold text-white">{fact.value}</b> {fact.label}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/dashboard/licitaciones?nueva=1"
              className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:bg-white/90 sm:flex-none"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Nueva licitación
            </Link>
            <Link
              href="/dashboard/licitaciones"
              className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[10px] bg-white/10 px-4 py-2.5 text-sm font-semibold text-white outline outline-1 outline-white/25 transition-colors hover:bg-white/20 sm:flex-none"
            >
              Ver licitaciones
            </Link>
          </div>
        </div>

        <Link
          href="/dashboard/solicitudes"
          className="relative block min-w-0 rounded-2xl border border-white/15 bg-white/[0.06] p-4 transition-colors hover:bg-white/[0.11] lg:w-72"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
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
              <p className="text-xs text-[#AFC0DA]">
                {solicitudes.unread > 0 ? `${solicitudes.unread} sin leer` : 'Todo leído'}
                {solicitudes.lastReceivedAt && ` · última ${timeAgo(solicitudes.lastReceivedAt)}`}
              </p>
            </div>
          </div>
          {senders.length > 0 && (
            <p className="mt-3 truncate border-t border-white/10 pt-2.5 text-[13px] text-[#C9D3E6]">{senders.slice(0, 3).join(' · ')}</p>
          )}
          <p className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-[#9FD8EA]">
            Ver solicitudes <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </p>
        </Link>
      </div>

      <HeroTicker solicitudes={solicitudes} />
    </section>
  )
}
