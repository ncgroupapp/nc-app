'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Boxes, CircleDollarSign, Package, Receipt, Warehouse } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { StockPurchasesDialog } from '@/components/stock/stock-purchases-dialog'

import { useDebounce } from '@/hooks/use-debounce'
import { handleActionError } from '@/lib/error-handler'
import { StockItem, StockSummary, formatMoney, stockService } from '@/services/stock.service'
import { PaginationMeta } from '@/types/api'

const PAGE_SIZE = 20

export default function StockPage() {
  const router = useRouter()

  const [items, setItems] = useState<StockItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, lastPage: 1, limit: PAGE_SIZE })
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)

  const loadPage = useCallback(async (page: number, search?: string) => {
    setIsLoading(true)
    try {
      const response = await stockService.getInStock({ page, limit: PAGE_SIZE, search })
      setItems(response.data)
      setMeta(response.meta)
    } catch (error) {
      handleActionError(error, 'Error al cargar el stock')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await stockService.getSummary())
    } catch (error) {
      console.error('Error loading stock summary:', error)
    }
  }, [])

  useEffect(() => {
    loadPage(1, debouncedSearch || undefined)
  }, [debouncedSearch, loadPage])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const refresh = () => {
    loadPage(meta.page, debouncedSearch || undefined)
    loadSummary()
  }

  const columns: DataTableColumn<StockItem>[] = [
    {
      key: 'image',
      header: 'Imagen',
      className: 'w-[88px]',
      render: (item) => (
        <div className="flex items-center justify-center size-14 rounded-xl overflow-hidden border bg-[radial-gradient(circle_at_50%_40%,#fff_0,#F1F5FA_70%)]">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt={item.name} className="max-w-[86%] max-h-[86%] object-contain mix-blend-multiply" />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground/60" />
          )}
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Producto',
      className: 'min-w-[220px]',
      render: (item) => (
        <div>
          <div className="font-semibold text-brand-navy">{item.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {item.code && <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-brand-navy">{item.code}</span>}
            {[item.brand, item.model].filter(Boolean).join(' ')}
          </div>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      className: 'w-[90px]',
      render: (item) => <span className="text-base font-extrabold text-brand-navy">{item.stockQuantity}</span>,
    },
    {
      key: 'cost',
      header: 'Último costo',
      className: 'w-[150px]',
      render: (item) =>
        item.lastPurchase ? (
          <span className="font-semibold">{formatMoney(item.lastPurchase.unitCost, item.lastPurchase.currency)}</span>
        ) : (
          <Badge variant="outline" className="rounded-full border-amber-100 bg-amber-50 text-amber-700">Sin costo</Badge>
        ),
    },
    {
      key: 'provider',
      header: 'Comprado a',
      className: 'min-w-[180px]',
      render: (item) =>
        item.lastPurchase ? (
          <div>
            <div className="text-sm">{item.lastPurchase.providerName}</div>
            {item.purchasesCount > 1 && (
              <div className="text-xs text-muted-foreground">{item.purchasesCount} compras registradas</div>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'value',
      header: 'Valor en stock',
      className: 'w-[150px]',
      render: (item) =>
        item.lastPurchase ? (
          <span className="font-bold text-brand-navy">
            {formatMoney(item.lastPurchase.unitCost * item.stockQuantity, item.lastPurchase.currency)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[200px] text-right',
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/productos/${item.id}`)}>
            Ver
          </Button>
          <Button size="sm" onClick={() => setSelectedItem(item)}>
            <Receipt className="mr-1.5 h-4 w-4" />
            {item.purchasesCount > 0 ? 'Compras' : 'Agregar costo'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <PageHeader
          title="Stock"
          subtitle="Productos en stock, su costo y a quién se compraron"
          backButton={false}
        />
      </FadeIn>

      <FadeIn delay={100}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard icon={Warehouse} label="Productos en stock" value={summary ? summary.productsInStock.toLocaleString('es-UY') : '—'} tone="blue" />
          <SummaryCard icon={Boxes} label="Unidades" value={summary ? summary.unitsInStock.toLocaleString('es-UY') : '—'} tone="cyan" />
          <SummaryCard
            icon={Receipt}
            label="Con costo cargado"
            value={summary ? `${summary.productsWithCost} de ${summary.productsInStock}` : '—'}
            tone="amber"
          />
          <SummaryCard
            icon={CircleDollarSign}
            label="Valor del stock"
            value={
              summary && summary.valueByCurrency.length > 0
                ? summary.valueByCurrency.map((row) => formatMoney(row.value, row.currency)).join(' · ')
                : '—'
            }
            tone="navy"
          />
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                <span>Productos en stock</span>
                <Badge variant="outline">{meta.total} productos</Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                El valor se calcula con el costo de la última compra registrada.
              </CardDescription>
            </div>
            <div className="w-full md:w-96">
              <SearchInput
                placeholder="Buscar por nombre, código, marca o modelo..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={items}
              isLoading={isLoading}
              pagination={{
                page: meta.page,
                limit: meta.limit,
                total: meta.total,
                totalPages: meta.lastPage,
                onPageChange: (page) => loadPage(page, debouncedSearch || undefined),
              }}
              emptyMessage="No hay productos con stock"
            />
          </CardContent>
        </Card>
      </FadeIn>

      <StockPurchasesDialog
        item={selectedItem}
        onOpenChange={(open) => { if (!open) setSelectedItem(null) }}
        onChanged={refresh}
      />
    </div>
  )
}

const TONES = {
  blue: 'bg-[#E8F2FA] text-brand-blue',
  cyan: 'bg-[#E5F8FA] text-[#0B9AA6]',
  amber: 'bg-amber-50 text-amber-700',
  navy: 'bg-brand-navy text-white',
} as const

interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: keyof typeof TONES
}

function SummaryCard({ icon: Icon, label, value, tone }: SummaryCardProps) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-4 px-5">
        <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-extrabold text-brand-navy" title={value}>{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
