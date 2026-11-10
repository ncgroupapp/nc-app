'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  Settings2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { exportProfitabilityToExcel } from '@/components/rentabilidad/export-excel'
import { MARGIN_GOOD, ProfitabilityInsights, ProfitabilityKpis, marginTone } from '@/components/rentabilidad/insights'
import { SettingsDialog } from '@/components/rentabilidad/settings-dialog'

import { useDebounce } from '@/hooks/use-debounce'
import { handleActionError } from '@/lib/error-handler'
import {
  PROFITABILITY_STATUSES,
  PROFITABILITY_STATUS_LABELS,
  ProfitabilityItem,
  ProfitabilityLicitation,
  ProfitabilityReport,
  ProfitabilityStatus,
  rentabilidadService,
} from '@/services/rentabilidad.service'

const ALL = 'todos'

const usd = (value: number) =>
  `USD ${value.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const money = (value: number, currency: string | null) =>
  `${currency ?? ''} ${value.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim()
const pct = (value: number | null) =>
  value === null ? '—' : `${value.toLocaleString('es-UY', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
const day = (iso: string) => new Date(iso).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: '2-digit' })

const TABS = [
  { key: 'todas', label: 'Todas', match: () => true },
  { key: 'adjudicadas', label: 'Adjudicadas', match: (l: ProfitabilityLicitation) => l.status === 'adjudicada' },
  { key: 'presentadas', label: 'Presentadas', match: (l: ProfitabilityLicitation) => l.status === 'presentada' },
  { key: 'bajo', label: 'Margen bajo', match: (l: ProfitabilityLicitation) => l.margin !== null && l.margin < MARGIN_GOOD },
] as const
type TabKey = (typeof TABS)[number]['key']

const MARGIN_BAR = { good: 'bg-emerald-600', mid: 'bg-amber-500', low: 'bg-red-600', none: 'bg-transparent' } as const

const STATUS_STYLES: Record<ProfitabilityStatus, string> = {
  abierta: 'border-sky-200 bg-sky-50 text-sky-700',
  presentada: 'border-amber-200 bg-amber-50 text-amber-700',
  adjudicada: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  perdida: 'border-red-200 bg-red-50 text-red-700',
  cerrada: 'border-slate-200 bg-slate-50 text-slate-600',
}

export default function RentabilidadPage() {
  const [report, setReport] = useState<ProfitabilityReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [clients, setClients] = useState<Map<number, string>>(new Map())

  const [search, setSearch] = useState('')
  const [product, setProduct] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState<string>(ALL)
  const [clientId, setClientId] = useState<string>(ALL)
  const [tab, setTab] = useState<TabKey>('todas')
  const debouncedSearch = useDebounce(search, 300)
  const debouncedProduct = useDebounce(product, 300)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await rentabilidadService.getReport({
        search: debouncedSearch || undefined,
        product: debouncedProduct || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: status === ALL ? undefined : (status as ProfitabilityStatus),
        clientId: clientId === ALL ? undefined : Number(clientId),
      })
      setReport(data)
      // Keep every client seen so the filter still lists them while one is selected.
      setClients((previous) => {
        const next = new Map(previous)
        data.licitations.forEach((l) => next.set(l.clientId, l.clientName.trim()))
        return next
      })
    } catch (error) {
      handleActionError(error, 'Error al cargar la rentabilidad')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, debouncedProduct, dateFrom, dateTo, status, clientId])

  useEffect(() => {
    load()
  }, [load])

  const toggle = (id: number) =>
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const exportExcel = async () => {
    if (!report) return
    setExporting(true)
    try {
      await exportProfitabilityToExcel(report)
    } catch (error) {
      handleActionError(error, 'No se pudo generar el Excel')
    } finally {
      setExporting(false)
    }
  }

  const settings = report?.settings ?? null
  const minMargin = settings?.minMargin ?? 5
  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0]
  const rows = report?.licitations.filter(activeTab.match) ?? []

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            title="Rentabilidad"
            subtitle="Ganancia, margen y markup por licitación. El costo es la oferta elegida en cada ítem de la cotización."
            backButton={false}
          />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 self-start rounded-xl border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent lg:self-auto"
          >
            <span>
              Tipo de cambio{' '}
              <b className="rounded-md bg-secondary px-2 py-0.5 font-mono text-brand-navy">
                {settings?.exchangeRate
                  ? `1 USD = ${settings.exchangeRate.toLocaleString('es-UY', { minimumFractionDigits: 2 })} UYU`
                  : 'sin cargar'}
              </b>
            </span>
            <span>
              Margen mín. <b className="rounded-md bg-secondary px-2 py-0.5 font-mono text-brand-navy">{pct(minMargin)}</b>
            </span>
            <Settings2 className="h-4 w-4" aria-label="Editar" />
          </button>
        </div>
      </FadeIn>

      {settings && !settings.exchangeRate && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Cargá el tipo de cambio para incluir las cotizaciones en pesos uruguayos.</span>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => setSettingsOpen(true)}>
            Cargar tipo de cambio
          </Button>
        </div>
      )}

      <FadeIn delay={100}>
        {report ? (
          <ProfitabilityKpis report={report} minMargin={minMargin} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
          </div>
        )}
      </FadeIn>

      {report && report.licitations.length > 0 && (
        <FadeIn delay={150}>
          <ProfitabilityInsights rows={report.licitations} />
        </FadeIn>
      )}

      <FadeIn delay={200}>
        <Card className="gap-0 overflow-hidden py-0">
          <div className="grid gap-3 border-b p-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_150px_150px] 2xl:grid-cols-[1.4fr_1.2fr_150px_150px_160px_200px_auto]">
            <SearchInput placeholder="Licitación, N° interno o cliente..." value={search} onChange={setSearch} />
            <SearchInput placeholder="Producto (nombre o código)..." value={product} onChange={setProduct} />
            <Input type="date" aria-label="Desde" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" aria-label="Hasta" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label="Estado"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los estados</SelectItem>
                {PROFITABILITY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{PROFITABILITY_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger aria-label="Cliente"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los clientes</SelectItem>
                {[...clients.entries()]
                  .sort((a, b) => a[1].localeCompare(b[1]))
                  .map(([id, name]) => (
                    <SelectItem key={id} value={String(id)}>{name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={exportExcel} disabled={!report || exporting} className="bg-[#0F7A43] text-white hover:bg-[#0c6537]">
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              Exportar a Excel
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 border-b px-4 py-3" role="tablist" aria-label="Vista">
            {TABS.map((t) => {
              const count = report?.licitations.filter(t.match).length ?? 0
              const active = t.key === tab
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${active ? 'border-brand-navy bg-brand-navy text-white' : 'bg-card hover:bg-accent'}`}
                >
                  {t.label}
                  <span className={`rounded-full px-1.5 text-xs font-bold ${active ? 'bg-white/20' : 'bg-muted text-muted-foreground'}`}>{count}</span>
                </button>
              )
            })}
          </div>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="min-w-[180px] pl-4">Licitación</TableHead>
                  <TableHead className="min-w-[180px]">Cliente</TableHead>
                  <TableHead>Inicio · Cierre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ofertado</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead className="text-center">Margen</TableHead>
                  <TableHead className="pr-4 text-right">Markup</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && !report ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : report && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                      No hay licitaciones con estos filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((l) => (
                    <Fragment key={l.id}>
                      <LicitationRow licitation={l} open={expanded.has(l.id)} onToggle={() => toggle(l.id)} />
                      {expanded.has(l.id) && <DetailRow licitation={l} minMargin={minMargin} />}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t px-4 py-3 text-xs text-muted-foreground">
            <Legend color="bg-emerald-600" text={`Margen de ${pct(minMargin)} o más`} />
            <Legend color="bg-red-600" text={`Margen menor a ${pct(minMargin)}`} />
            <Legend color="bg-amber-500" text="Ítems sin oferta elegida: no cuentan en el margen" />
            <span className="md:ml-auto">Clic en una licitación para ver sus productos</span>
          </div>
        </Card>
      </FadeIn>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} onSaved={() => load()} />
    </div>
  )
}

function LicitationRow({ licitation: l, open, onToggle }: { licitation: ProfitabilityLicitation; open: boolean; onToggle: () => void }) {
  const hasCost = l.margin !== null
  return (
    <TableRow className={`cursor-pointer ${open ? 'bg-sky-50/50' : ''}`} onClick={onToggle}>
      <TableCell className="pl-4">
        <div className="flex items-start gap-2">
          {open ? <ChevronDown className="mt-0.5 h-4 w-4 text-brand-blue" /> : <ChevronRight className="mt-0.5 h-4 w-4 text-brand-blue" />}
          <div>
            <Link
              href={`/dashboard/licitaciones/${l.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-brand-navy hover:underline"
            >
              {l.callNumber}
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {l.internalNumber}
              {l.itemsWithoutOffer > 0 && (
                <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 px-1.5 py-0 text-[10.5px] text-amber-700">
                  {l.itemsWithoutOffer} sin oferta
                </Badge>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm">{l.clientName}</TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{day(l.startDate)} · {day(l.deadlineDate)}</TableCell>
      <TableCell>
        <Badge variant="outline" className={`rounded-full ${STATUS_STYLES[l.status]}`}>{PROFITABILITY_STATUS_LABELS[l.status]}</Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums">{l.quotationId ? usd(l.offeredUsd) : <span className="text-muted-foreground">Sin cotización</span>}</TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums">{hasCost ? usd(l.costUsd) : '—'}</TableCell>
      <TableCell className={`whitespace-nowrap text-right font-semibold tabular-nums ${hasCost ? (l.profitUsd < 0 ? 'text-red-600' : 'text-emerald-700') : ''}`}>
        {hasCost ? usd(l.profitUsd) : '—'}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-2">
          <MarginPill value={l.margin} below={l.belowMinMargin} />
          {l.margin !== null && (
            <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-muted lg:block" aria-hidden="true">
              <span
                className={`block h-full rounded-full ${MARGIN_BAR[marginTone(l.margin)]}`}
                style={{ width: `${Math.min(Math.max(l.margin, 0), 60) / 60 * 100}%` }}
              />
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="pr-4 text-right tabular-nums">{pct(l.markup)}</TableCell>
    </TableRow>
  )
}

function DetailRow({ licitation: l, minMargin }: { licitation: ProfitabilityLicitation; minMargin: number }) {
  return (
    <TableRow className="bg-sky-50/50 hover:bg-sky-50/50">
      <TableCell colSpan={9} className="px-4 pb-4 pt-0 sm:pl-10">
        {l.items.length === 0 ? (
          <p className="rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
            {l.quotationId ? 'La cotización no tiene productos.' : 'Esta licitación todavía no tiene cotización.'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead>Oferta elegida</TableHead>
                  <TableHead className="text-right">Costo unit.</TableHead>
                  <TableHead className="text-right">Venta unit.</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead className="text-center">Margen</TableHead>
                  <TableHead className="text-right">Markup</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {l.items.map((item) => (
                  <ItemRow key={item.id} item={item} minMargin={minMargin} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

function ItemRow({ item, minMargin }: { item: ProfitabilityItem; minMargin: number }) {
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium text-brand-navy">{item.productName}</div>
        {item.productCode && <div className="font-mono text-xs text-muted-foreground">{item.productCode}</div>}
      </TableCell>
      <TableCell className="text-right tabular-nums">{item.quantity.toLocaleString('es-UY')}</TableCell>
      <TableCell>
        {item.state === 'sin_oferta' ? (
          <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">Sin oferta</Badge>
        ) : (
          <div className="text-sm">
            {item.providerName || 'Proveedor'}
            {item.offerDate && <div className="text-xs text-muted-foreground">Oferta del {day(item.offerDate)}</div>}
          </div>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums">
        {item.unitCost === null ? '—' : (
          <>
            {money(item.unitCost, item.costCurrency)}
            {item.costCurrency !== 'USD' && item.unitCostUsd !== null && <div className="text-xs text-muted-foreground">{usd(item.unitCostUsd)}</div>}
          </>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums">
        {money(item.unitSale, item.saleCurrency)}
        {item.saleCurrency !== 'USD' && item.unitSaleUsd !== null && <div className="text-xs text-muted-foreground">{usd(item.unitSaleUsd)}</div>}
      </TableCell>
      <TableCell className={`whitespace-nowrap text-right font-semibold tabular-nums ${item.profitUsd === null ? '' : item.profitUsd < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
        {item.profitUsd === null ? '—' : usd(item.profitUsd)}
      </TableCell>
      <TableCell className="text-center">
        {item.state === 'sin_conversion' ? (
          <span className="text-xs text-muted-foreground">Moneda sin conversión</span>
        ) : (
          <MarginPill value={item.margin} below={item.margin !== null && item.margin < minMargin} />
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{pct(item.markup)}</TableCell>
    </TableRow>
  )
}

function MarginPill({ value, below }: { value: number | null; below: boolean }) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  return (
    <span className={`inline-block min-w-[64px] rounded-lg px-2 py-0.5 text-center text-sm font-extrabold ${below ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
      {pct(value)}
    </span>
  )
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <i className={`inline-block size-2.5 rounded-full ${color}`} />
      {text}
    </span>
  )
}
