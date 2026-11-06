'use client'

import { useEffect, useState } from 'react'

import { DashboardOverview, dashboardService } from '@/services/dashboard.service'

interface TickerItem {
  key: string
  text: string
  urgent?: boolean
}

/** Seconds per item, so the band keeps the same reading speed with few or many items. */
const SECONDS_PER_ITEM = 7

/** Scrolling band at the bottom of the hero: today's closings and the newest requests. */
export function HeroTicker({ solicitudes }: { solicitudes: DashboardOverview['solicitudes'] }) {
  const [closings, setClosings] = useState<TickerItem[]>([])

  useEffect(() => {
    let cancelled = false
    dashboardService
      .getAlerts()
      .then((alerts) => {
        if (cancelled) return
        setClosings(
          alerts.closingToday.map((l) => {
            const missing = l.missingOffers.length
            const state = l.closed
              ? 'ya cerró'
              : missing > 0
                ? `${missing} ${missing === 1 ? 'producto' : 'productos'} sin oferta`
                : l.quotationStatus === 'finalizada'
                  ? 'lista para enviar'
                  : 'cotización sin finalizar'
            return {
              key: `l${l.id}`,
              text: `Cierra ${l.deadlineTime} · ${l.clientName ?? 'Sin cliente'} · ${l.callNumber} · ${state}`,
              urgent: !l.closed && missing > 0,
            }
          }),
        )
      })
      .catch((error) => console.error('Error loading ticker alerts:', error))
    return () => {
      cancelled = true
    }
  }, [])

  const requests: TickerItem[] = solicitudes.latest
    .filter((s) => s.status === 'nueva')
    .slice(0, 4)
    .map((s) => ({ key: `s${s.id}`, text: `Nueva solicitud · ${s.fromName || s.fromEmail || 'Sin remitente'} · ${s.subject || 'Sin asunto'}` }))

  const items = [...closings, ...requests]
  if (items.length === 0) return null

  // The list is rendered twice so the loop restarts seamlessly halfway through
  const loop = [...items, ...items]
  return (
    <div className="nc-ticker relative overflow-hidden border-t border-white/10 bg-white/[0.04] py-2.5 text-[13px] text-white/85">
      <div className="nc-ticker-run" style={{ '--nc-ticker-duration': `${items.length * SECONDS_PER_ITEM}s` } as React.CSSProperties}>
        {loop.map((item, i) => (
          <span key={`${item.key}-${i}`} className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-6 ${item.urgent ? 'text-[#FFB4A8]' : ''}`} aria-hidden={i >= items.length}>
            <span className={`size-1.5 rounded-full ${item.urgent ? 'bg-[#FF8A7A]' : 'bg-brand-cyan'}`} />
            {item.text}
          </span>
        ))}
      </div>
    </div>
  )
}
