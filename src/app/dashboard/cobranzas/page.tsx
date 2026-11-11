'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FileDown, Landmark, Loader2, Package, Pencil, Percent, Plus, Trash2, TrendingUp, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { showSnackbar } from '@/components/ui/snackbar'
import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { CountUp } from '@/components/dashboard/overview/count-up'
import { CollectionDialog } from '@/components/cobranzas/collection-dialog'
import { useConfirm } from '@/hooks/use-confirm'
import { handleActionError } from '@/lib/error-handler'
import { cn } from '@/lib/utils'
import { Collection, ProfitPartner, collectionsService, money, percent, shortDate } from '@/services/collections.service'

const METRIC_TONES = {
  blue: { card: 'border-blue-200 bg-blue-50/70', icon: 'bg-brand-blue text-white', value: 'text-brand-navy', label: 'text-blue-900/70' },
  slate: { card: 'border-slate-200 bg-slate-50', icon: 'bg-slate-500 text-white', value: 'text-slate-800', label: 'text-slate-600' },
  green: { card: 'border-emerald-200 bg-emerald-50/70', icon: 'bg-emerald-600 text-white', value: 'text-emerald-900', label: 'text-emerald-900/70' },
  violet: { card: 'border-violet-200 bg-violet-50/70', icon: 'bg-violet-600 text-white', value: 'text-violet-950', label: 'text-violet-900/70' },
} as const

function Metric({ label, value, hint, icon: Icon, tone }: { label: string; value: React.ReactNode; hint: string; icon: LucideIcon; tone: keyof typeof METRIC_TONES }) {
  const style = METRIC_TONES[tone]
  return (
    <Card className={cn('h-full gap-0 py-0 shadow-sm', style.card)}>
      <CardContent className="flex items-center gap-3.5 p-4">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm', style.icon)}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className={cn('text-sm font-medium', style.label)}>{label}</p>
          <p className={cn('whitespace-nowrap text-2xl font-extrabold leading-tight tracking-tight tabular-nums', style.value)}>{value}</p>
          <p className={cn('text-xs leading-snug', style.label)}>{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Panel({ title, subtitle, children, className }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('gap-0 py-0 shadow-sm', className)}>
      <CardContent className="p-4 md:p-5">
        <h2 className="text-[15px] font-bold">{title}</h2>
        <p className="mb-3 text-[12.5px] text-muted-foreground">{subtitle}</p>
        {children}
      </CardContent>
    </Card>
  )
}

const marginColor = (margin: number | null) =>
  margin === null ? 'text-muted-foreground' : margin >= 30 ? 'text-emerald-700' : margin >= 15 ? 'text-amber-700' : 'text-red-700'

const TABS = [
  { key: 'todas', label: 'Todas', match: () => true },
  { key: 'publico', label: 'Entes públicos', match: (c: Collection) => c.clientKind === 'publico' },
  { key: 'privado', label: 'Privados', match: (c: Collection) => c.clientKind === 'privado' },
  { key: 'sin_costo', label: 'Sin costo cargado', match: (c: Collection) => c.cost <= 0 },
] as const
type TabKey = (typeof TABS)[number]['key']

const CURRENCIES = ['USD', 'UYU'] as const

export default function CobranzasPage() {
  const { confirm } = useConfirm()
  const [items, setItems] = useState<Collection[]>([])
  const [partners, setPartners] = useState<ProfitPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabKey>('todas')
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>('USD')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [downloading, setDownloading] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await collectionsService.getAll()
      setItems(data.items)
      setPartners(data.partners)
    } catch (error) {
      handleActionError(error, 'Error al cargar las cobranzas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Default to the currency that has collections
  useEffect(() => {
    if (items.length && !items.some((c) => c.currency === currency)) setCurrency(items[0].currency === 'UYU' ? 'UYU' : 'USD')
  }, [items, currency])

  const term = search.trim().toLowerCase()
  const searched = useMemo(
    () =>
      items.filter(
        (c) =>
          !term ||
          [c.number, c.clientName, c.reference, c.bank, ...c.invoices.map((i) => i.label)]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(term)),
      ),
    [items, term],
  )
  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0]
  const rows = searched.filter(activeTab.match)

  // Figures of the panels, in the chosen currency
  const inCurrency = searched.filter((c) => c.currency === currency)
  const sum = (pick: (c: Collection) => number) => inCurrency.reduce((s, c) => s + pick(c), 0)
  const net = sum((c) => c.totals.net)
  const cost = sum((c) => c.cost)
  const profit = sum((c) => c.totals.profit)
  const salesTax = sum((c) => c.totals.salesTax)
  const purchaseTax = sum((c) => c.purchaseTax)
  const margin = net > 0 ? (profit / net) * 100 : null
  const markup = cost > 0 ? (profit / cost) * 100 : null

  const byClient = [...inCurrency.reduce((map, c) => {
    const entry = map.get(c.clientName) ?? { name: c.clientName, net: 0, profit: 0 }
    entry.net += c.totals.net
    entry.profit += c.totals.profit
    return map.set(c.clientName, entry)
  }, new Map<string, { name: string; net: number; profit: number }>()).values()]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5)
  const maxClientProfit = Math.max(...byClient.map((c) => c.profit), 1)

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const download = async (c: Collection) => {
    setDownloading(c.id)
    try {
      await collectionsService.downloadPdf(c)
    } catch (error) {
      handleActionError(error, 'No se pudo descargar el PDF')
    } finally {
      setDownloading(null)
    }
  }

  const remove = async (c: Collection) => {
    const ok = await confirm({
      title: 'Eliminar cobranza',
      message: `¿Eliminar la cobranza ${c.number} de ${c.clientName}? ${c.invoices.length === 1 ? "Su factura vuelve" : `Sus ${c.invoices.length} facturas vuelven`} a quedar por cobrar.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    })
    if (!ok) return
    try {
      await collectionsService.delete(c.id)
      showSnackbar(`Cobranza ${c.number} eliminada`, 'success')
      load()
    } catch (error) {
      handleActionError(error, 'No se pudo eliminar la cobranza')
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            title="Cobranzas"
            subtitle="Transferencias recibidas y las facturas que cancelan, con su costo, IVA y ganancia."
            backButton={false}
          />
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <div className="flex rounded-lg border bg-card p-0.5" role="group" aria-label="Moneda de los totales">
              {CURRENCIES.map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrency(cur)}
                  aria-pressed={currency === cur}
                  className={cn('rounded-md px-3 py-1 text-sm font-semibold', currency === cur ? 'bg-brand-navy text-white' : 'text-muted-foreground hover:bg-accent')}
                >
                  {cur}
                </button>
              ))}
            </div>
            <Button onClick={openNew} className="bg-brand-navy text-white hover:bg-brand-navy/90">
              <Plus className="mr-2 h-4 w-4" /> Registrar cobranza
            </Button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        {loading && !items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Cobrado (sin IVA)" tone="blue" icon={Landmark} value={<CountUp value={net} format={(n) => `${currency} ${money(n, 0)}`} />} hint={`${inCurrency.length} ${inCurrency.length === 1 ? 'cobranza' : 'cobranzas'} en ${currency}`} />
            <Metric label="Costo mercadería" tone="slate" icon={Package} value={<CountUp value={cost} format={(n) => `${currency} ${money(n, 0)}`} />} hint="Sin IVA" />
            <Metric label="Ganancia" tone="green" icon={TrendingUp} value={<CountUp value={profit} format={(n) => `${currency} ${money(n, 0)}`} />} hint="Venta neta menos costo" />
            <Metric label="Margen promedio" tone="violet" icon={Percent} value={margin === null ? '—' : <CountUp value={margin} format={(n) => percent(n)} />} hint={`Markup ${percent(markup)}`} />
          </div>
        )}
      </FadeIn>

      {inCurrency.length > 0 && (
        <FadeIn delay={150}>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="IVA del período" subtitle={`Lo cobrado menos lo pagado a proveedores · ${currency}`}>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-orange-50 px-1 py-3 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200">
                  <p className="text-[11px] font-medium">IVA ventas</p>
                  <p className="text-lg font-extrabold tabular-nums">{money(salesTax, 0)}</p>
                </div>
                <div className="rounded-xl bg-teal-50 px-1 py-3 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                  <p className="text-[11px] font-medium">IVA compras</p>
                  <p className="text-lg font-extrabold tabular-nums">{money(purchaseTax, 0)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 px-1 py-3 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="text-[11px] font-medium">A pagar DGI</p>
                  <p className="text-lg font-extrabold tabular-nums">{money(salesTax - purchaseTax, 0)}</p>
                </div>
              </div>
            </Panel>

            <Panel title="Margen por cliente" subtitle="Ganancia de lo cobrado a cada uno">
              <div className="space-y-2">
                {byClient.map((c, i) => (
                  <div key={c.name} className="grid grid-cols-[minmax(0,120px)_1fr_auto] items-center gap-2 text-[12.5px]">
                    <span className="truncate" title={c.name}>{c.name}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-muted">
                      <span className="nc-fill block h-full rounded-full" style={{ width: `${Math.max((c.profit / maxClientProfit) * 100, 2)}%`, background: i < 2 ? 'var(--brand-blue)' : '#85B7EB' }} />
                    </span>
                    <span className="whitespace-nowrap tabular-nums">
                      {money(c.profit, 0)} · <b className={cn('font-semibold', marginColor(c.net > 0 ? (c.profit / c.net) * 100 : null))}>{percent(c.net > 0 ? (c.profit / c.net) * 100 : null)}</b>
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Reparto de la ganancia" subtitle={`Lo que le toca a cada socio · ${currency}`}>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between rounded-lg bg-muted/60 px-2.5 py-1.5 font-bold">
                  <span>Total · 100 %</span>
                  <span className="tabular-nums">{money(profit)}</span>
                </div>
                {partners.map((p) => (
                  <div key={p.name} className="flex justify-between px-2.5">
                    <span className="truncate">{p.name} <span className="text-muted-foreground">· {p.share} %</span></span>
                    <span className="tabular-nums">{money(inCurrency.reduce((s, c) => s + (c.totals.partners.find((x) => x.name === p.name)?.amount ?? 0), 0))}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={200}>
        <Card className="gap-0 overflow-hidden py-0">
          <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Vista">
              {TABS.map((t) => {
                const active = t.key === tab
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.key)}
                    className={cn('flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors', active ? 'border-brand-navy bg-brand-navy text-white' : 'bg-card hover:bg-accent')}
                  >
                    {t.label}
                    <span className={cn('rounded-full px-1.5 text-xs font-bold', active ? 'bg-white/20' : 'bg-muted text-muted-foreground')}>{searched.filter(t.match).length}</span>
                  </button>
                )
              })}
            </div>
            <div className="md:w-72">
              <SearchInput placeholder="Cliente, factura, referencia..." value={search} onChange={setSearch} />
            </div>
          </div>

          {loading && !items.length ? (
            <div className="space-y-3 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <p className="font-semibold">{items.length ? 'No hay cobranzas con estos filtros' : 'Registrá tu primera cobranza'}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {items.length ? 'Probá con otra búsqueda o pestaña.' : 'Elegí las facturas que paga una transferencia y cargá el costo de la mercadería.'}
              </p>
              {!items.length && (
                <Button onClick={openNew} className="mt-4 bg-brand-navy text-white hover:bg-brand-navy/90">
                  <Plus className="mr-2 h-4 w-4" /> Registrar cobranza
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Transferencia · cliente</th>
                    <th className="px-3 py-2.5 text-right font-medium">Cobrado</th>
                    <th className="px-3 py-2.5 text-right font-medium">Costo</th>
                    <th className="px-3 py-2.5 text-right font-medium">Ganancia</th>
                    <th className="px-3 py-2.5 text-right font-medium">IVA vtas / cpras</th>
                    <th className="px-3 py-2.5 text-center font-medium">Margen</th>
                    <th className="px-4 py-2.5 text-right font-medium"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-t align-top hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-brand-navy dark:text-foreground">{c.clientName}</span>
                          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', c.clientKind === 'publico' ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200' : 'bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200')}>
                            {c.clientKind === 'publico' ? 'Ente público' : 'Privado'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {c.number} · {[c.bank, c.reference ? `ref. ${c.reference}` : null].filter(Boolean).join(' · ') || 'Sin datos de transferencia'} · {shortDate(c.date)}
                          {c.licitation && (
                            <> · <Link href={`/dashboard/licitaciones/${c.licitation.id}`} className="text-brand-blue hover:underline">{c.licitation.callNumber}</Link></>
                          )}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {c.invoices.map((i) => (
                            <span key={i.id} className="rounded-md border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">{i.label}</span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                        {c.currency} {money(c.totals.net)}
                        <div className="text-xs text-muted-foreground">Recibido {money(c.amountReceived)}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                        {c.cost > 0 ? money(c.cost) : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Sin costo</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-emerald-700">{c.cost > 0 ? money(c.totals.profit) : '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{money(c.totals.salesTax)} / {money(c.purchaseTax)}</td>
                      <td className={cn('whitespace-nowrap px-3 py-3 text-center font-bold tabular-nums', marginColor(c.cost > 0 ? c.totals.margin : null))}>
                        {c.cost > 0 ? percent(c.totals.margin) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => download(c)} disabled={downloading === c.id}>
                            {downloading === c.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileDown className="mr-1.5 h-3.5 w-3.5" />}
                            PDF
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(c); setDialogOpen(true) }} aria-label={`Editar ${c.number}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => remove(c)} aria-label={`Eliminar ${c.number}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </FadeIn>

      <CollectionDialog open={dialogOpen} collection={editing} partners={partners} onOpenChange={setDialogOpen} onSaved={load} />
    </div>
  )
}
