'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { describeExpiry } from '@/services/certificates.service'
import { DashboardAlerts, dashboardService } from '@/services/dashboard.service'

const REFRESH_MS = 5 * 60_000
const MAX_ITEMS = 6
const TIME_ZONE = 'America/Montevideo'

type Tone = 'red' | 'amber' | 'gray' | 'green'

interface TodayItem {
  key: string
  chip: string
  tone: Tone
  title: string
  detail: string
  href: string
  done?: boolean
}

const TONES: Record<Tone, string> = {
  red: 'bg-red-50 text-red-700',
  amber: 'bg-amber-50 text-amber-800',
  gray: 'bg-slate-100 text-slate-600',
  green: 'bg-emerald-50 text-emerald-700',
}

const nowUyMinutes = () => {
  const [h, m] = new Date()
    .toLocaleTimeString('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false })
    .split(':')
    .map(Number)
  return h * 60 + m
}

function buildItems(alerts: DashboardAlerts): TodayItem[] {
  const now = nowUyMinutes()
  const items: TodayItem[] = []

  for (const licitation of alerts.closingToday) {
    const [h, m] = licitation.deadlineTime.split(':').map(Number)
    const left = h * 60 + m - now
    const closed = licitation.closed || left <= 0
    const ready = licitation.quotationStatus === 'finalizada'
    const detail = closed
      ? 'Ya cerró'
      : [
          left < 60 ? `Faltan ${left} min` : `Faltan ${Math.floor(left / 60)} h ${left % 60} min`,
          licitation.missingOffers.length > 0 &&
            `${licitation.missingOffers.length} ${licitation.missingOffers.length === 1 ? 'producto' : 'productos'} sin oferta`,
          !ready && (licitation.quotationStatus === 'creada' ? 'cotización sin finalizar' : 'sin cotización'),
        ]
          .filter(Boolean)
          .join(' · ')
    items.push({
      key: `l${licitation.id}`,
      chip: licitation.deadlineTime,
      tone: closed ? 'gray' : ready ? 'green' : left <= 120 ? 'red' : 'amber',
      title: [licitation.clientName, licitation.callNumber].filter(Boolean).join(' · '),
      detail: ready && !closed ? 'Cotizada · lista para enviar' : detail,
      href: `/dashboard/licitaciones/${licitation.id}`,
      done: ready,
    })
  }

  for (const certificate of alerts.certificates ?? []) {
    items.push({
      key: `c${certificate.id}`,
      chip: certificate.requiredForRupe ? 'RUPE' : 'Cert.',
      tone: certificate.status === 'vencido' ? 'red' : certificate.status === 'por_vencer' ? 'amber' : 'gray',
      title: certificate.name,
      detail: describeExpiry(certificate),
      href: '/dashboard/certificados',
    })
  }

  for (const quotation of alerts.unfinishedQuotations) {
    if (alerts.closingToday.some((l) => l.quotationId === quotation.id)) continue
    items.push({
      key: `q${quotation.id}`,
      chip: quotation.deadlineDay ? `${quotation.deadlineDay.slice(8, 10)}/${quotation.deadlineDay.slice(5, 7)}` : 'Cotiz.',
      tone: quotation.overdue ? 'gray' : 'amber',
      title: [quotation.clientName, quotation.callNumber ?? quotation.quotationIdentifier].filter(Boolean).join(' · '),
      detail: quotation.overdue ? 'Cotización sin finalizar · ya cerró' : 'Cotización sin finalizar',
      href: quotation.licitationId ? `/dashboard/licitaciones/${quotation.licitationId}` : '/dashboard/cotizaciones',
    })
  }
  return items
}

/** Everything that needs attention today: closings, certificates and unfinished quotations. */
export function TodayCard() {
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await dashboardService.getAlerts()
        if (!cancelled) setAlerts(data)
      } catch (error) {
        console.error('Error loading dashboard alerts:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const items = alerts ? buildItems(alerts) : []
  const pending = items.filter((item) => !item.done && item.tone !== 'gray').length

  return (
    <Card className="gap-0 rounded-2xl p-0 shadow-xs">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 md:px-5 md:pt-5">
        <div>
          <h2 className="text-[15px] font-bold">Para hacer hoy</h2>
          <p className="text-[12.5px] text-muted-foreground">Se actualiza cada 5 minutos</p>
        </div>
        {pending > 0 && (
          <span className="whitespace-nowrap rounded-full bg-red-50 px-2 py-0.5 text-[11.5px] font-semibold text-red-700">
            {pending} {pending === 1 ? 'pendiente' : 'pendientes'}
          </span>
        )}
      </div>
      <div className="space-y-2 px-4 pb-4 pt-3.5 md:px-5 md:pb-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Check className="h-5 w-5" aria-hidden="true" />
            </span>
            Nada pendiente para hoy.
          </div>
        ) : (
          <>
            {items.slice(0, MAX_ITEMS).map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span className={cn('w-14 shrink-0 rounded-lg py-1.5 text-center text-[13px] font-bold tabular-nums', TONES[item.tone])}>
                  {item.chip}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
                </span>
                {item.done && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-semibold text-emerald-700">
                    <Check className="h-3 w-3" aria-hidden="true" /> Lista
                  </span>
                )}
              </Link>
            ))}
            {items.length > MAX_ITEMS && (
              <p className="pt-1 text-center text-xs text-muted-foreground">y {items.length - MAX_ITEMS} más</p>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
