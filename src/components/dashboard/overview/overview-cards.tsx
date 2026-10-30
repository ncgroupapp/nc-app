import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DashboardOverview, OverviewCertificateStatus } from '@/services/dashboard.service'
import { formatCompactMoney } from './format'

function CardHead({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4 md:px-5 md:pt-5">
      <div>
        <h2 className="text-[15px] font-bold">{title}</h2>
        <p className="text-[12.5px] text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

const STAGES = [
  { key: 'received', label: 'Recibidas', color: '#9CC8EA' },
  { key: 'quoted', label: 'Cotizadas', color: '#4F9ED6' },
  { key: 'adjudicated', label: 'Adjudicadas', color: 'var(--brand-blue)' },
  { key: 'delivered', label: 'Entregadas', color: 'var(--brand-navy)' },
] as const

export function FunnelCard({ funnel }: { funnel: DashboardOverview['licitations']['funnel'] }) {
  const base = Math.max(funnel.received, 1)
  const winsPerTen = funnel.quoted > 0 ? Math.round((funnel.adjudicated / funnel.quoted) * 100) / 10 : null
  return (
    <Card className="gap-0 rounded-2xl p-0 shadow-xs">
      <CardHead title="Embudo de licitaciones" subtitle="Recibidas en los últimos 90 días" />
      <div className="space-y-3 px-4 pb-4 pt-4 md:px-5 md:pb-5">
        {STAGES.map((stage) => (
          <div key={stage.key} className="grid grid-cols-[96px_1fr_36px] items-center gap-2.5 text-[13px]">
            <span>{stage.label}</span>
            <div className="h-3 overflow-hidden rounded-md bg-slate-100">
              <div className="h-full rounded-md" style={{ width: `${(funnel[stage.key] / base) * 100}%`, background: stage.color }} />
            </div>
            <span className="text-right font-bold tabular-nums">{funnel[stage.key]}</span>
          </div>
        ))}
        <div className="!mt-4 flex items-center justify-between rounded-xl bg-[#F2F9FC] px-3.5 py-3 text-[12.5px] text-muted-foreground">
          {winsPerTen === null ? (
            <span>Todavía no hay cotizaciones en este período</span>
          ) : (
            <>
              <span>De cada 10 cotizaciones<br />ganamos</span>
              <b className="text-xl text-brand-navy">{winsPerTen.toLocaleString('es-UY')}</b>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

/** "Hospital de Clínicas" → "HC", "ASSE" → "AS" */
const initials = (name: string) => {
  const words = name.split(/\s+/).filter((word) => word.length > 2)
  return (words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : name.slice(0, 2)).toUpperCase()
}

export function TopClientsCard({ clients }: { clients: DashboardOverview['billing']['topClients'] }) {
  const max = Math.max(...clients.map((c) => c.UYU), 1)
  return (
    <Card className="gap-0 rounded-2xl p-0 shadow-xs">
      <CardHead title="Mejores clientes" subtitle="Facturado en el año" />
      <div className="space-y-3 px-4 pb-4 pt-4 md:px-5 md:pb-5">
        {clients.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin facturas este año.</p>
        ) : (
          clients.map((client) => (
            <div key={client.name} className="grid grid-cols-[30px_1fr_auto] items-center gap-2.5">
              <span className="flex size-[30px] items-center justify-center rounded-lg bg-[#E6F7F9] text-[11px] font-bold text-brand-navy">
                {initials(client.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{client.name}</p>
                <div className="mt-1 h-[5px] rounded-full bg-brand-cyan" style={{ width: `${Math.max(4, (client.UYU / max) * 100)}%` }} />
              </div>
              <div className="text-right text-[13px] font-bold tabular-nums">
                {formatCompactMoney(client.UYU)}
                {client.USD !== 0 && <span className="block text-[11px] font-semibold text-muted-foreground">{formatCompactMoney(client.USD, 'USD')}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export function LatestInvoicesCard({ invoices }: { invoices: DashboardOverview['billing']['latest'] }) {
  return (
    <Card className="gap-0 rounded-2xl p-0 shadow-xs">
      <CardHead
        title="Últimas facturas"
        subtitle="Desde la carpeta Ventas NC GROUP"
        action={
          <Link href="/dashboard/facturacion" className="flex items-center gap-1 whitespace-nowrap text-[12.5px] font-semibold text-brand-blue hover:underline">
            Ver todas <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        }
      />
      <div className="px-4 pb-4 pt-3 md:px-5 md:pb-5">
        {invoices.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay facturas.</p>
        ) : (
          <table className="w-full table-fixed text-[12.5px]">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="w-[74px] pb-2 font-medium">N.º</th>
                <th className="pb-2 font-medium">Cliente</th>
                <th className="w-[100px] pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const credit = invoice.type === 'nota_credito'
                return (
                  <tr key={invoice.id} className="border-t">
                    <td className="whitespace-nowrap py-2.5 pr-2 font-mono font-bold">
                      {invoice.number ? [invoice.series, invoice.number].filter(Boolean).join(' ') : '—'}
                    </td>
                    <td className="py-2.5 pr-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={cn(
                            'shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                            credit ? 'bg-amber-50 text-amber-800' : 'bg-[#E6F1FA] text-[#0A5A93]',
                          )}
                        >
                          {credit ? 'NC' : 'Factura'}
                        </span>
                        <span className="truncate">{invoice.clientName ?? '—'}</span>
                      </span>
                    </td>
                    <td className={cn('whitespace-nowrap py-2.5 text-right font-bold tabular-nums', credit && 'text-amber-700')}>
                      {invoice.total === null ? '—' : formatCompactMoney(credit ? -Math.abs(invoice.total) : invoice.total, invoice.currency)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}

const CERT_DOT: Record<OverviewCertificateStatus, string> = {
  vencido: 'bg-red-600',
  por_vencer: 'bg-amber-500',
  vigente: 'bg-emerald-600',
  sin_cargar: 'bg-slate-400',
}

const certLabel = (status: OverviewCertificateStatus, daysLeft: number | null) =>
  status === 'vencido' ? 'vencido' : status === 'por_vencer' ? `${daysLeft} días` : status === 'vigente' ? 'vigente' : 'sin cargar'

/** Short names for the built-in RUPE certificates */
const shortName = (name: string) => name.match(/\b(DGI|BPS|BSE)\b/)?.[1] ?? name.replace(/^Certificado\s+/i, '').replace(/^\w/, (c) => c.toUpperCase())

export function RupeStrip({ certificates }: { certificates: DashboardOverview['certificates'] }) {
  if (certificates.length === 0) return null
  const allOk = certificates.every((c) => c.status === 'vigente')
  return (
    <Card className="flex-row flex-wrap items-center gap-3 rounded-2xl px-4 py-3.5 shadow-xs md:gap-3.5 md:px-5">
      <div className="mr-1.5 flex items-center gap-2.5 text-sm font-bold">
        <span className={cn('flex size-[34px] items-center justify-center rounded-[10px] text-white', allOk ? 'bg-emerald-600' : 'bg-brand-navy')}>
          <ShieldCheck className="h-[17px] w-[17px]" aria-hidden="true" />
        </span>
        Estado RUPE
      </div>
      {certificates.map((certificate) => (
        <span key={certificate.id} className="flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[12.5px]" title={certificate.name}>
          <span className={cn('size-2 rounded-full', CERT_DOT[certificate.status])} aria-hidden="true" />
          {shortName(certificate.name)}
          <span className="text-muted-foreground">{certLabel(certificate.status, certificate.daysLeft)}</span>
        </span>
      ))}
      <Link href="/dashboard/certificados" className="flex items-center gap-1 text-[12.5px] font-semibold text-brand-blue hover:underline md:ml-auto">
        {allOk ? 'Ver certificados' : 'Renovar certificados'} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </Card>
  )
}
