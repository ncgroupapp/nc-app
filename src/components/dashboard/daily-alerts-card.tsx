'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, BadgeCheck, Bell, Check, ChevronRight, FilePen, Gavel } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/common/fade-in'
import { cn } from '@/lib/utils'
import { CertificateAlert, ClosingLicitation, DashboardAlerts, dashboardService } from '@/services/dashboard.service'
import { describeExpiry } from '@/services/certificates.service'

const TIME_ZONE = 'America/Montevideo'
const REFRESH_MS = 5 * 60_000

/** Minutes since midnight in Uruguay, for the countdown to today's closings. */
const nowUyMinutes = () => {
  const [hours, minutes] = new Date()
    .toLocaleTimeString('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false })
    .split(':')
    .map(Number)
  return hours * 60 + minutes
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const formatRemaining = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `faltan ${hours} h ${rest} min` : `faltan ${rest} min`
}

const formatLongDay = (isoDay: string) => {
  const [year, month, day] = isoDay.split('-').map(Number)
  const text = new Date(year, month - 1, day).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const formatShortDay = (isoDay: string) => {
  const [, month, day] = isoDay.split('-')
  return `${day}/${month}`
}

/** Red under 2 h, amber under 6 h, neutral otherwise; muted once closed. */
function timeChipClass(licitation: ClosingLicitation, minutesLeft: number) {
  if (licitation.closed || minutesLeft <= 0) return 'bg-muted text-muted-foreground line-through decoration-1'
  if (minutesLeft <= 120) return 'bg-red-100 text-red-700'
  if (minutesLeft <= 360) return 'bg-amber-100 text-amber-800'
  return 'bg-slate-100 text-slate-700'
}

const CERTIFICATE_CHIP: Record<CertificateAlert['status'], { label: string; className: string }> = {
  vencido: { label: 'Vencido', className: 'bg-red-100 text-red-700' },
  por_vencer: { label: 'Por vencer', className: 'bg-amber-100 text-amber-800' },
  sin_cargar: { label: 'Sin cargar', className: 'bg-slate-100 text-slate-700' },
}

function QuotationBadge({ status }: { status: ClosingLicitation['quotationStatus'] }) {
  if (status === 'finalizada') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
        <Check className="h-3 w-3" aria-hidden="true" /> Cotizada
      </span>
    )
  }
  if (status === 'creada') {
    return <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Cotización sin finalizar</span>
  }
  return <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Sin cotización</span>
}

/** Dashboard card: calls that close today (with products still missing a supplier offer), unfinished quotations and certificates to renew. */
export function DailyAlertsCard() {
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nowMinutes, setNowMinutes] = useState(nowUyMinutes)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await dashboardService.getAlerts()
        if (!cancelled) setAlerts(data)
      } catch (error) {
        console.error('Error loading dashboard alerts:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    const reload = setInterval(load, REFRESH_MS)
    const tick = setInterval(() => setNowMinutes(nowUyMinutes()), 60_000)
    return () => {
      cancelled = true
      clearInterval(reload)
      clearInterval(tick)
    }
  }, [])

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />
  }

  const closing = alerts?.closingToday ?? []
  const unfinished = alerts?.unfinishedQuotations ?? []
  const certificates = alerts?.certificates ?? []
  // Nothing pending: keep the dashboard clean
  if (!alerts || (closing.length === 0 && unfinished.length === 0 && certificates.length === 0)) return null

  const summary = [
    closing.length > 0 && `${closing.length} ${closing.length === 1 ? 'compra cierra' : 'compras cierran'} hoy`,
    unfinished.length > 0 && `${unfinished.length} ${unfinished.length === 1 ? 'cotización sin finalizar' : 'cotizaciones sin finalizar'}`,
    certificates.length > 0 && `${certificates.length} ${certificates.length === 1 ? 'certificado para renovar' : 'certificados para renovar'}`,
  ].filter(Boolean).join(' · ')

  return (
    <FadeIn delay={20}>
      <Card className="overflow-hidden border-brand-blue/30 shadow-sm gap-0 py-0">
        <CardHeader className="flex flex-row items-center gap-3 border-b bg-[#F4F8FC] py-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base text-brand-navy">Alertas de hoy</CardTitle>
            <CardDescription>{formatLongDay(alerts.today)} · {summary}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 py-4">
          {closing.length > 0 && (
            <section aria-labelledby="alerts-closing">
              <h3 id="alerts-closing" className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Gavel className="h-3.5 w-3.5" aria-hidden="true" /> Cierran hoy
              </h3>
              <ul className="space-y-2">
                {closing.map((licitation) => {
                  const minutesLeft = toMinutes(licitation.deadlineTime) - nowMinutes
                  const isClosed = licitation.closed || minutesLeft <= 0
                  return (
                    <li key={licitation.id} className="overflow-hidden rounded-lg border">
                      <Link
                        href={`/dashboard/licitaciones/${licitation.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <span className={cn('w-14 shrink-0 rounded-md py-1 text-center text-sm font-semibold tabular-nums', timeChipClass(licitation, minutesLeft))}>
                          {licitation.deadlineTime}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {licitation.callNumber}
                            {licitation.internalNumber && (
                              <span className="font-normal text-muted-foreground"> · {licitation.internalNumber}</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {licitation.clientName ?? 'Sin cliente'} · {isClosed ? 'ya cerró' : formatRemaining(minutesLeft)}
                          </p>
                        </div>
                        <QuotationBadge status={licitation.quotationStatus} />
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </Link>
                      {licitation.missingOffers.length > 0 && (
                        <div className="border-t border-dashed bg-muted/40 px-3 py-2 sm:pl-[5.25rem]">
                          <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                            {licitation.missingOffers.length === 1
                              ? '1 producto sin oferta: falta pedir precio'
                              : `${licitation.missingOffers.length} productos sin oferta: falta pedir precio`}
                          </p>
                          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                            {licitation.missingOffers.map((product) => (
                              <li key={product.productId}>
                                <Link href={`/dashboard/productos/${product.productId}`} className="hover:text-foreground hover:underline">
                                  {product.code ? `${product.code} · ` : ''}{product.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {unfinished.length > 0 && (
            <section aria-labelledby="alerts-unfinished">
              <h3 id="alerts-unfinished" className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <FilePen className="h-3.5 w-3.5" aria-hidden="true" /> Cotizaciones sin finalizar
              </h3>
              <ul className="divide-y rounded-lg border">
                {unfinished.map((quotation) => {
                  const closesToday = quotation.deadlineDay === alerts.today
                  const deadline = quotation.deadlineDay
                    ? `${quotation.overdue ? 'Cerró' : 'Cierra'} ${closesToday ? 'hoy' : formatShortDay(quotation.deadlineDay)} ${quotation.deadlineTime}`
                    : 'Sin fecha de cierre'
                  const content = (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{quotation.quotationIdentifier}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {quotation.clientName ?? 'Sin cliente'} · {quotation.itemCount} {quotation.itemCount === 1 ? 'ítem' : 'ítems'}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-xs',
                          quotation.overdue ? 'text-muted-foreground' : closesToday ? 'font-medium text-red-700' : 'text-muted-foreground',
                        )}
                      >
                        {deadline}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </>
                  )
                  return (
                    <li key={quotation.id}>
                      {quotation.licitationId ? (
                        <Link
                          href={`/dashboard/licitaciones/${quotation.licitationId}`}
                          className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                        >
                          {content}
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard/cotizaciones"
                          className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                        >
                          {content}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {certificates.length > 0 && (
            <section aria-labelledby="alerts-certificates">
              <h3 id="alerts-certificates" className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Certificados
              </h3>
              <ul className="divide-y rounded-lg border">
                {certificates.map((certificate) => (
                  <li key={certificate.id}>
                    <Link
                      href="/dashboard/certificados"
                      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <span className={cn('w-20 shrink-0 rounded-md py-1 text-center text-xs font-semibold', CERTIFICATE_CHIP[certificate.status].className)}>
                        {CERTIFICATE_CHIP[certificate.status].label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {certificate.name}
                          {certificate.requiredForRupe && <span className="font-normal text-muted-foreground"> · RUPE</span>}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{describeExpiry(certificate)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  )
}
