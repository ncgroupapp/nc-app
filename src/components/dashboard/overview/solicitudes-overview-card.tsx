import Link from 'next/link'
import { ArrowRight, Inbox, Paperclip } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DashboardOverview } from '@/services/dashboard.service'
import { buildLicitacionUrl } from '@/services/solicitudes.service'
import { formatDuration, timeAgo } from './format'

const STATS = [
  { key: 'new', label: 'Nuevas', dot: 'bg-brand-blue' },
  { key: 'inProgress', label: 'En proceso', dot: 'bg-amber-500' },
  { key: 'resolvedThisMonth', label: 'Resueltas este mes', dot: 'bg-emerald-600' },
] as const

/** Requests that arrived by mail: inbox status and the latest ones, ready to turn into a licitation. */
export function SolicitudesOverviewCard({ data }: { data: DashboardOverview['solicitudes'] }) {
  return (
    <Card className="grid gap-0 overflow-hidden rounded-2xl p-0 shadow-xs lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col gap-4 border-b bg-[#F6F9FD] p-4 md:p-5 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3">
          <span className="flex size-[38px] items-center justify-center rounded-[11px] bg-brand-navy text-white">
            <Inbox className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[15px] font-bold">Solicitudes de clientes</h2>
            <p className="text-[12.5px] text-muted-foreground">Pedidos que llegan por mail</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {STATS.map((stat) => (
            <div key={stat.key} className="rounded-xl border bg-white p-2.5">
              <p className="text-[22px] font-extrabold leading-tight">{data[stat.key]}</p>
              <p className="flex items-start gap-1.5 text-[11.5px] leading-tight text-muted-foreground">
                <span className={cn('mt-[3px] size-2 shrink-0 rounded-full', stat.dot)} aria-hidden="true" />
                {stat.label}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[12.5px] text-muted-foreground">
          {data.avgResponseMinutes === null ? (
            'Todavía no hay respuestas para medir el tiempo de respuesta'
          ) : (
            <>
              Respondés en promedio en <b className="text-foreground">{formatDuration(data.avgResponseMinutes)}</b>
            </>
          )}
        </p>
        <Link href="/dashboard/solicitudes" className="mt-auto hidden items-center gap-1 text-[13px] font-semibold text-brand-blue hover:underline lg:flex">
          Ver todas <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="px-4 py-1 md:px-5 md:py-2">
        {data.latest.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No hay solicitudes pendientes. ¡Bandeja al día!</p>
        ) : (
          <ul className="divide-y">
            {data.latest.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 md:flex-nowrap">
                <Link href={`/dashboard/solicitudes/${item.id}`} className="flex min-w-0 flex-1 basis-full items-center gap-3 md:basis-auto">
                  <span
                    className={cn('size-2 shrink-0 rounded-full', item.unread ? 'bg-brand-blue' : 'bg-transparent')}
                    aria-label={item.unread ? 'Sin leer' : undefined}
                  />
                  <span className="min-w-0">
                    <span className={cn('block text-[13.5px] text-brand-navy md:truncate', item.unread ? 'font-extrabold' : 'font-semibold')}>
                      {item.subject || '(sin asunto)'}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[item.fromName, item.fromEmail].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </Link>
                <span className="ml-5 flex items-center gap-3 md:ml-0">
                  {item.assignee ? (
                    <span className="whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-semibold text-amber-800">
                      Asignada a {item.assignee}
                    </span>
                  ) : (
                    item.attachments > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground" title={`${item.attachments} adjuntos`}>
                        <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                        {item.attachments}
                      </span>
                    )
                  )}
                  <span className="whitespace-nowrap text-xs text-muted-foreground md:w-[76px] md:text-right">{timeAgo(item.receivedAt)}</span>
                </span>
                <Link
                  href={buildLicitacionUrl(item)}
                  className="ml-auto whitespace-nowrap rounded-lg border border-brand-navy/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  Armar licitación
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
