'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Eye, FileCheck2, FileText, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { showSnackbar } from '@/components/ui/snackbar'
import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { PurchaseOrderDialog } from '@/components/ordenes-compra/purchase-order-dialog'
import { PdfPreviewDialog, PdfRequest } from '@/components/remitos/pdf-preview-dialog'
import { useConfirm } from '@/hooks/use-confirm'
import { useDebounce } from '@/hooks/use-debounce'
import { handleActionError } from '@/lib/error-handler'
import { cn } from '@/lib/utils'
import { formatBillingNumber, formatMoney } from '@/services/billing.service'
import { PurchaseOrder, PurchaseOrderList, PurchaseOrderMetrics, purchaseOrdersService } from '@/services/purchase-orders.service'
import { formatIsoDate } from '@/services/remitos.service'

const PAGE_SIZE = 25

function Metric({ label, value, hint, warn }: { label: string; value: string; hint: string; warn?: boolean }) {
  return (
    <Card className="gap-0 py-0 shadow-xs">
      <CardContent className="p-4">
        <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
        <p className={cn('mt-0.5 text-2xl font-extrabold tracking-tight', warn && 'text-amber-700')}>{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

const Chip = ({ children, tone }: { children: React.ReactNode; tone: 'blue' | 'green' | 'amber' }) => (
  <span
    className={cn(
      'mb-1 mr-1 inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium',
      tone === 'blue' && 'bg-[#EAF3FB] text-brand-blue',
      tone === 'green' && 'bg-emerald-100 text-emerald-800',
      tone === 'amber' && 'bg-amber-100 text-amber-800',
    )}
  >
    {children}
  </span>
)

export default function OrdenesCompraPage() {
  const { confirm } = useConfirm()
  const [list, setList] = useState<PurchaseOrderList | null>(null)
  const [metrics, setMetrics] = useState<PurchaseOrderMetrics | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseOrder | null>(null)
  const [preview, setPreview] = useState<PdfRequest | null>(null)

  const load = useCallback(async () => {
    try {
      const [orders, totals] = await Promise.all([
        purchaseOrdersService.getAll({ search: debouncedSearch || undefined, page, limit: PAGE_SIZE }),
        purchaseOrdersService.getMetrics(),
      ])
      setList(orders)
      setMetrics(totals)
    } catch (error) {
      handleActionError(error, 'No se pudieron cargar las órdenes de compra')
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => setPage(1), [debouncedSearch])

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (order: PurchaseOrder) => {
    setEditing(order)
    setDialogOpen(true)
  }

  const remove = async (order: PurchaseOrder) => {
    const ok = await confirm({
      title: 'Eliminar orden de compra',
      message: `¿Eliminar la orden ${order.number} y su PDF? Las facturas, remitos y la licitación vinculados no se borran.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    })
    if (!ok) return
    try {
      await purchaseOrdersService.delete(order.id)
      showSnackbar(`Orden ${order.number} eliminada`, 'success')
      load()
    } catch (error) {
      handleActionError(error, 'No se pudo eliminar la orden')
    }
  }

  const showFile = (order: PurchaseOrder) =>
    setPreview({ title: `Orden de compra ${order.number}`, fileName: order.fileName ?? `${order.number}.pdf`, load: () => purchaseOrdersService.getFile(order) })

  const amounts = metrics
    ? [metrics.amounts.UYU && formatMoney(metrics.amounts.UYU, 'UYU'), metrics.amounts.USD && formatMoney(metrics.amounts.USD, 'USD')].filter(Boolean)
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes de compra"
        subtitle="Las órdenes que mandan los clientes, con su PDF, licitación, facturas y remitos"
        icon={FileCheck2}
        backButton={false}
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Nueva orden
          </Button>
        }
      />

      <FadeIn className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {metrics ? (
          <>
            <Metric label="Órdenes cargadas" value={String(metrics.total)} hint={`${metrics.thisMonth} este mes`} />
            <Metric label="Monto total" value={amounts[0] || formatMoney(0, 'UYU')} hint={amounts[1] ? `+ ${amounts[1]}` : 'Suma de todas las órdenes'} />
            <Metric label="Sin facturar" value={String(metrics.withoutInvoice)} hint="Sin factura vinculada" warn={metrics.withoutInvoice > 0} />
            <Metric label="Sin remito" value={String(metrics.withoutRemito)} hint="Sin entrega vinculada" warn={metrics.withoutRemito > 0} />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        )}
      </FadeIn>

      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <div className="p-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por número, cliente o licitación..." />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N.º orden</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Licitación</TableHead>
                  <TableHead>Facturas</TableHead>
                  <TableHead>Remitos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[90px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!list ? (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Cargando...</TableCell></TableRow>
                ) : list.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      {search ? 'No hay órdenes con esa búsqueda.' : 'Todavía no cargaste órdenes de compra. Tocá "Nueva orden" para subir la primera.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  list.data.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-semibold">{order.number}</div>
                        {order.fileName ? (
                          <button type="button" onClick={() => showFile(order)} className="flex items-center gap-1 text-xs text-brand-blue hover:underline">
                            <FileText className="h-3 w-3" aria-hidden="true" /> Ver PDF
                          </button>
                        ) : (
                          <span className="text-xs text-amber-700">Sin archivo</span>
                        )}
                      </TableCell>
                      <TableCell>{formatIsoDate(order.issueDate)}</TableCell>
                      <TableCell>{order.clientName ?? <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell>
                        {order.licitation ? (
                          <Link href={`/dashboard/licitaciones/${order.licitation.id}`} className="hover:underline">
                            <Chip tone="blue">{order.licitation.callNumber}</Chip>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.invoices.length > 0 ? (
                          order.invoices.map((invoice) => <Chip key={invoice.id} tone="green">{formatBillingNumber(invoice)}</Chip>)
                        ) : (
                          <Chip tone="amber">Sin factura</Chip>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.remitos.length > 0 ? (
                          order.remitos.map((remito) => <Chip key={remito.id} tone="green">Remito {remito.number}</Chip>)
                        ) : (
                          <Chip tone="amber">Sin remito</Chip>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatMoney(order.total, order.currency)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {order.fileName && (
                            <Button variant="ghost" size="icon" title="Ver PDF" aria-label={`Ver PDF de ${order.number}`} onClick={() => showFile(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Más acciones">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(order)}>
                                <Pencil className="mr-2 h-4 w-4" /> Editar y vincular
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => remove(order)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {list && list.meta.lastPage > 1 && (
            <div className="flex items-center justify-end gap-2 border-t p-3 text-sm">
              <span className="text-muted-foreground">Página {list.meta.page} de {list.meta.lastPage}</span>
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Página anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={page >= list.meta.lastPage} onClick={() => setPage((p) => p + 1)} aria-label="Página siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PurchaseOrderDialog open={dialogOpen} order={editing} onOpenChange={setDialogOpen} onSaved={load} />
      <PdfPreviewDialog request={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
