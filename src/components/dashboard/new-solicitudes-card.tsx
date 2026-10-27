'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FilePlus2, Inbox } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/common/fade-in'

import {
  Solicitud,
  SolicitudStatus,
  buildLicitacionUrl,
  formatDateTime,
  solicitudesService,
} from '@/services/solicitudes.service'

const LATEST_COUNT = 5

/** Dashboard notice with the requests that arrived by mail and are still "Nueva". */
export function NewSolicitudesCard() {
  const [items, setItems] = useState<Solicitud[]>([])
  const [total, setTotal] = useState(0)
  const [unread, setUnread] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [list, summary] = await Promise.all([
          solicitudesService.getAll({ status: SolicitudStatus.NEW, limit: LATEST_COUNT }),
          solicitudesService.getSummary(),
        ])
        if (cancelled) return
        setItems(list.data)
        setTotal(list.meta?.total ?? list.data.length)
        setUnread(summary.unread)
      } catch (error) {
        console.error('Error loading new solicitudes:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  // Nothing pending: keep the dashboard clean
  if (!isLoading && total === 0) return null

  return (
    <FadeIn delay={30}>
      <Card className="overflow-hidden border-brand-blue/30 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 bg-[#F4F8FC] pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex size-11 items-center justify-center rounded-xl bg-brand-navy text-white">
              <Inbox className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-brand-cyan px-1 text-[11px] font-bold text-brand-navy">
                  {unread}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-base text-brand-navy">
                {isLoading ? 'Solicitudes nuevas' : `${total} ${total === 1 ? 'solicitud nueva' : 'solicitudes nuevas'}`}
              </CardTitle>
              <CardDescription>
                {unread > 0 ? `${unread} sin leer · ` : ''}Pedidos de clientes que llegaron por mail
              </CardDescription>
            </div>
          </div>
          <Link
            href="/dashboard/solicitudes"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90"
          >
            Ver solicitudes <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-3">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))
            : items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-[#F4F8FC]">
                <Link href={`/dashboard/solicitudes/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`size-2 shrink-0 rounded-full ${item.unread ? 'bg-brand-blue' : 'bg-transparent'}`}
                    aria-label={item.unread ? 'Sin leer' : undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm text-brand-navy ${item.unread ? 'font-bold' : 'font-semibold'}`}>
                      {item.subject || '(sin asunto)'}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {item.fromName || item.fromEmail}
                      {item.fromName && item.fromEmail ? ` · ${item.fromEmail}` : ''}
                    </div>
                  </div>
                  <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                    {formatDateTime(item.receivedAt)}
                  </div>
                  {item.unread && (
                    <Badge variant="outline" className="hidden shrink-0 rounded-full border-[#CFE3F4] bg-[#E8F2FA] text-brand-blue md:inline-flex">
                      Sin leer
                    </Badge>
                  )}
                </Link>
                <Link
                  href={buildLicitacionUrl(item)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-navy/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  <FilePlus2 className="h-3.5 w-3.5" /> Armar licitación
                </Link>
                </div>
              ))}
        </CardContent>
      </Card>
    </FadeIn>
  )
}
