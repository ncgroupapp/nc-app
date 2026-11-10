'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Package, Receipt, ReceiptText, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { CountUp } from '@/components/dashboard/overview/count-up'
import { StockPurchasesDialog } from '@/components/stock/stock-purchases-dialog'

import { useDebounce } from '@/hooks/use-debounce'
import { handleActionError } from '@/lib/error-handler'
import { cn } from '@/lib/utils'
import { StockItem, StockSummary, formatMoney, stockService } from '@/services/stock.service'
import { PaginationMeta } from '@/types/api'

const PAGE_SIZE = 20
/** Same threshold as the server's "pocas unidades" */
const LOW_STOCK_UNITS = 2

type StockView = 'todos' | 'pocas' | 'sin_costo'

const METRIC_TONES = {
  blue: { card: 'border-blue-200 bg-blue-50/70', icon: 'bg-brand-blue', value: 'text-brand-navy', label: 'text-blue-900/70' },
  teal: { card: 'border-teal-200 bg-teal-50/70', icon: 'bg-teal-600', value: 'text-teal-900', label: 'text-teal-900/70' },
  amber: { card: 'border-amber-200 bg-amber-50', icon: 'bg-amber-500', value: 'text-amber-900', label: 'text-amber-900/70' },
  quiet: { card: 'border-slate-200 bg-slate-50', icon: 'bg-slate-400', value: 'text-slate-800', label: 'text-slate-600' },
} as const

function Metric({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string
  value: React.ReactNode
  hint: string
  /** A Lucide icon element, or a short text such as "USD" */
  icon: React.ReactNode
  tone: keyof typeof METRIC_TONES
}) {
  const style = METRIC_TONES[tone]
  return (
    <Card className={cn('h-full gap-0 py-0 shadow-sm', style.card)}>
      <CardContent className="flex items-center gap-3.5 p-4">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm', style.icon)}>{icon}</div>
        <div className="min-w-0">
          <p className={cn('text-sm font-medium', style.label)}>{label}</p>
          <p className={cn('whitespace-nowrap text-2xl font-extrabold leading-tight tracking-tight tabular-nums', style.value)}>{value}</p>
          <p className={cn('text-xs leading-snug', style.label)}>{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/** Brands with the most products in stock; clicking one filters the table by it */
function TopBrands({
  brands,
  selected,
  onSelect,
}: {
  brands: NonNullable<StockSummary['topBrands']>
  selected: string | null
  onSelect: (brand: string | null) => void
}) {
  const max = Math.max(...brands.map((b) => b.products), 1)
  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardContent className="p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold">Marcas con más productos en stock</h2>
          <span className="text-xs text-muted-foreground">Tocá una para filtrar</span>
        </div>
        <div className="space-y-2">
          {brands.map((brand, i) => (
            <button
              key={brand.brand}
              type="button"
              onClick={() => onSelect(selected === brand.brand ? null : brand.brand)}
              className={cn(
                'grid w-full grid-cols-[120px_1fr_110px] items-center gap-3 rounded-md px-1.5 py-1 text-left text-[13px] transition-colors hover:bg-muted/60',
                selected === brand.brand && 'bg-[#EAF3FB]',
              )}
            >
              <span className="truncate font-medium">{brand.brand}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="nc-fill block h-full rounded-full"
                  style={{
                    width: `${(brand.products / max) * 100}%`,
                    background: i < 3 ? 'var(--brand-blue)' : '#85B7EB',
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              </span>
              <span className="text-right text-xs tabular-nums text-muted-foreground">
                {brand.products} prod. · {brand.units.toLocaleString('es-UY')} u.
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function StockPage() {
  const router = useRouter()

  const [items, setItems] = useState<StockItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, lastPage: 1, limit: PAGE_SIZE })
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [view, setView] = useState<StockView>('todos')
  const [brand, setBrand] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)

  const loadPage = useCallback(
    async (page: number) => {
      setIsLoading(true)
      try {
        const response = await stockService.getInStock({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
          view: view === 'todos' ? undefined : view,
          brand: brand ?? undefined,
        })
        setItems(response.data)
        setMeta(response.meta)
      } catch (error) {
        handleActionError(error, 'Error al cargar el stock')
      } finally {
        setIsLoading(false)
      }
    },
    [debouncedSearch, view, brand],
  )

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await stockService.getSummary())
    } catch (error) {
      console.error('Error loading stock summary:', error)
    }
  }, [])

  useEffect(() => {
    loadPage(1)
  }, [loadPage])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const refresh = () => {
    loadPage(meta.page)
    loadSummary()
  }

  const withoutCost = summary ? summary.productsInStock - summary.productsWithCost : 0
  const usdValue = summary?.valueByCurrency.find((row) => row.currency === 'USD')
  const otherValues = summary?.valueByCurrency.filter((row) => row.currency !== 'USD') ?? []

  const tabs: Array<{ value: StockView; label: string; count?: number; warn?: boolean }> = [
    { value: 'todos', label: 'Todos', count: summary?.productsInStock },
    { value: 'pocas', label: 'Pocas unidades', count: summary?.lowStock, warn: true },
    { value: 'sin_costo', label: 'Sin costo', count: summary ? withoutCost : undefined },
  ]

  const columns: DataTableColumn<StockItem>[] = [
    {
      key: 'product',
      header: 'Producto',
      className: 'min-w-[280px]',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-[radial-gradient(circle_at_50%_40%,#fff_0,#F1F5FA_70%)]">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.name} className="max-h-[86%] max-w-[86%] object-contain mix-blend-multiply" />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground/60" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-brand-navy">{item.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {item.code && <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-brand-navy">{item.code}</span>}
              {[item.brand, item.model].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      className: 'w-[90px] text-center',
      render: (item) => (
        <span
          className={cn(
            'inline-flex h-7 min-w-10 items-center justify-center rounded-full px-2.5 text-sm font-extrabold tabular-nums',
            item.stockQuantity <= LOW_STOCK_UNITS ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
          )}
          title={item.stockQuantity <= LOW_STOCK_UNITS ? 'Quedan pocas unidades' : undefined}
        >
          {item.stockQuantity}
        </span>
      ),
    },
    {
      key: 'cost',
      header: 'Último costo',
      className: 'w-[130px] text-right',
      render: (item) =>
        item.lastPurchase ? (
          <span className="font-semibold tabular-nums">{formatMoney(item.lastPurchase.unitCost, item.lastPurchase.currency)}</span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Sin costo</span>
        ),
    },
    {
      key: 'provider',
      header: 'Comprado a',
      className: 'min-w-[180px]',
      render: (item) =>
        item.lastPurchase ? (
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">{item.lastPurchase.providerName}</span>
            {item.purchasesCount > 1 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{item.purchasesCount} compras</span>
            )}
          </div>
        ) : (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedItem(item)}>
            + Agregar costo
          </Button>
        ),
    },
    {
      key: 'value',
      header: 'Valor en stock',
      className: 'w-[140px] text-right',
      render: (item) =>
        item.lastPurchase ? (
          <span className="font-bold tabular-nums text-brand-navy">
            {formatMoney(item.lastPurchase.unitCost * item.stockQuantity, item.lastPurchase.currency)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[170px] text-right',
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/productos/${item.id}`)}>
            Ver
          </Button>
          {item.purchasesCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
              <Receipt className="mr-1.5 h-4 w-4" /> Compras
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <PageHeader title="Stock" subtitle="Productos en depósito, su costo y a quién se compraron" backButton={false} />
      </FadeIn>

      <FadeIn delay={80} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary ? (
          <>
            <Metric
              label="Valor del stock"
              tone="blue"
              icon={<span className="text-sm font-extrabold tracking-wide">USD</span>}
              value={usdValue ? <CountUp value={usdValue.value} format={(n) => formatMoney(n, 'USD')} /> : '—'}
              hint={otherValues.length ? `+ ${otherValues.map((row) => formatMoney(row.value, row.currency)).join(' + ')}` : 'Al último costo de compra'}
            />
            <Metric
              label="Productos en stock"
              tone="teal"
              icon={<Package className="h-6 w-6" aria-hidden="true" />}
              value={<CountUp value={summary.productsInStock} format={(n) => Math.round(n).toLocaleString('es-UY')} />}
              hint={`${summary.unitsInStock.toLocaleString('es-UY')} unidades`}
            />
            <Metric
              label="Pocas unidades"
              tone={summary.lowStock ? 'amber' : 'quiet'}
              icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
              value={<CountUp value={summary.lowStock ?? 0} format={(n) => String(Math.round(n))} />}
              hint={`Con ${LOW_STOCK_UNITS} o menos en depósito`}
            />
            <Metric
              label="Sin costo cargado"
              tone="quiet"
              icon={<ReceiptText className="h-6 w-6" aria-hidden="true" />}
              value={<CountUp value={withoutCost} format={(n) => String(Math.round(n))} />}
              hint={`${summary.productsWithCost} de ${summary.productsInStock} tienen costo`}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)
        )}
      </FadeIn>

      {summary?.topBrands && summary.topBrands.length > 0 && (
        <FadeIn delay={140}>
          <TopBrands brands={summary.topBrands} selected={brand} onSelect={setBrand} />
        </FadeIn>
      )}

      <FadeIn delay={200}>
        <Card className="gap-0 overflow-hidden py-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
              <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Qué productos ver">
                {tabs.map((tab) => {
                  const active = view === tab.value
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setView(tab.value)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                        active ? 'bg-brand-navy text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {tab.label}
                      {tab.count !== undefined && (
                        <span
                          className={cn(
                            'rounded-full px-1.5 text-xs tabular-nums',
                            active ? 'bg-white/20' : tab.warn && tab.count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-muted',
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  )
                })}
                {brand && (
                  <span className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-full border bg-[#EAF3FB] px-3 text-sm font-medium text-brand-navy">
                    {brand}
                    <button type="button" aria-label="Quitar filtro de marca" onClick={() => setBrand(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
              <div className="flex-1 lg:flex lg:justify-end">
                <div className="w-full lg:max-w-sm">
                  <SearchInput placeholder="Buscar nombre, código, marca o modelo..." value={searchTerm} onChange={setSearchTerm} />
                </div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <DataTable
                columns={columns}
                data={items}
                isLoading={isLoading}
                pagination={{
                  page: meta.page,
                  limit: meta.limit,
                  total: meta.total,
                  totalPages: meta.lastPage,
                  onPageChange: (page) => loadPage(page),
                }}
                emptyMessage={view === 'todos' && !brand && !searchTerm ? 'No hay productos con stock' : 'No hay productos con esos filtros'}
              />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <StockPurchasesDialog
        item={selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null)
        }}
        onChanged={refresh}
      />
    </div>
  )
}
