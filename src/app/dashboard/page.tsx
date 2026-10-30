'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/common/fade-in'
import { BillingChartCard } from '@/components/dashboard/overview/billing-chart-card'
import { FunnelCard, LatestInvoicesCard, RupeStrip, TopClientsCard } from '@/components/dashboard/overview/overview-cards'
import { OverviewHero } from '@/components/dashboard/overview/overview-hero'
import { OverviewKpis } from '@/components/dashboard/overview/overview-kpis'
import { SolicitudesOverviewCard } from '@/components/dashboard/overview/solicitudes-overview-card'
import { TodayCard } from '@/components/dashboard/overview/today-card'
import { DashboardOverview, dashboardService } from '@/services/dashboard.service'

/** New requests and invoices from the folder agent show up without reloading */
const REFRESH_MS = 5 * 60_000

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await dashboardService.getOverview())
      setError(null)
    } catch (err) {
      console.error('Error loading dashboard overview:', err)
      setError('No se pudieron cargar los datos del dashboard. Verificá tu conexión e intentá de nuevo.')
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  if (!data) {
    return (
      <div className="space-y-5">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              {error}
              <Button size="sm" variant="outline" onClick={load}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Skeleton className="h-52 w-full rounded-[20px]" />
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <FadeIn direction="none">
        <OverviewHero data={data} />
      </FadeIn>
      <FadeIn delay={40}>
        <OverviewKpis data={data} />
      </FadeIn>
      <FadeIn delay={80}>
        <SolicitudesOverviewCard data={data.solicitudes} />
      </FadeIn>
      <FadeIn delay={120} className="grid gap-4 md:gap-5 xl:grid-cols-[1.65fr_1fr] xl:items-start">
        <BillingChartCard data={data.billing} />
        <TodayCard />
      </FadeIn>
      <FadeIn delay={160} className="grid gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1.1fr]">
        <FunnelCard funnel={data.licitations.funnel} />
        <TopClientsCard clients={data.billing.topClients} />
        <div className="lg:col-span-2 xl:col-span-1">
          <LatestInvoicesCard invoices={data.billing.latest} />
        </div>
      </FadeIn>
      <FadeIn delay={200}>
        <RupeStrip certificates={data.certificates} />
      </FadeIn>
    </div>
  )
}
