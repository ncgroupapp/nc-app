'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Banknote,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderSync,
  MoreHorizontal,
  Pencil,
  Receipt,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { showSnackbar } from '@/components/ui/snackbar'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { CountUp } from '@/components/dashboard/overview/count-up'
import { BillingDocumentDialog } from '@/components/facturacion/billing-document-dialog'
import { ClientPicker, PickedClient } from '@/components/facturacion/client-picker'
import { PdfPreviewDialog, PdfRequest } from '@/components/remitos/pdf-preview-dialog'

import { useConfirm } from '@/hooks/use-confirm'
import { useDebounce } from '@/hooks/use-debounce'
import { handleActionError } from '@/lib/error-handler'
import { cn } from '@/lib/utils'
import { formatIsoDate } from '@/services/remitos.service'
import {
  BILLING_SORT_LABELS,
  BILLING_TYPE_LABELS,
  BillingCurrency,
  BillingDocument,
  BillingListResponse,
  BillingSort,
  BillingSummaryRow,
  BillingTabCounts,
  billingService,
  formatBillingNumber,
  formatMoney,
  paymentDueDate,
} from '@/services/billing.service'

const todayInUruguay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Montevideo' })

/** "2027-02-01" → "01/02" */
const shortDate = (iso: string) => formatIsoDate(iso).slice(0, 5)

/**
 * Invoices: a green "Cobrada" chip (click to undo), or the due date at 60 business days as an
 * amber (pending) or red (overdue) chip with a button to mark it collected.
 */
function PaymentCell({ doc, onToggle }: { doc: BillingDocument; onToggle: (doc: BillingDocument) => void }) {
  if (doc.type !== 'factura' || !doc.issueDate) return <span className="text-xs text-muted-foreground">—</span>
  if (doc.paidAt) {
    return (
      <button
        type="button"
        onClick={() => onToggle(doc)}
        title="Marcar como no cobrada"
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200"
      >
        <Check className="h-3 w-3" aria-hidden="true" /> Cobrada {shortDate(doc.paidAt)}
      </button>
    )
  }
  const due = paymentDueDate(doc.issueDate)
  const overdue = due < todayInUruguay()
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
          overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800',
        )}
        title={`Vence a los 60 días hábiles: ${formatIsoDate(due)}`}
      >
        {overdue ? <AlertTriangle className="h-3 w-3" aria-hidden="true" /> : <Clock className="h-3 w-3" aria-hidden="true" />}
        {overdue ? 'Venció' : 'Vence'} {shortDate(due)}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="size-7 rounded-full text-emerald-700 hover:bg-emerald-50"
        title="Marcar como cobrada"
        aria-label={`Marcar ${formatBillingNumber(doc)} como cobrada`}
        onClick={() => onToggle(doc)}
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

/** "INTENDENCIA DE SALTO" → "IS" */
const initials = (name: string) => {
  const words = name.split(/\s+/).filter((word) => word.length > 2)
  return (words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : name.slice(0, 2)).toUpperCase()
}

type BillingTab = 'all' | 'factura' | 'nota_credito' | 'por_cobrar' | 'vencida'

const TABS: Array<{ value: BillingTab; label: string; count: keyof BillingTabCounts }> = [
  { value: 'all', label: 'Todas', count: 'all' },
  { value: 'factura', label: 'Facturas', count: 'invoices' },
  { value: 'nota_credito', label: 'Notas de crédito', count: 'creditNotes' },
  { value: 'por_cobrar', label: 'Por cobrar', count: 'toCollect' },
  { value: 'vencida', label: 'Vencidas', count: 'overdue' },
]

/** Net billed in one currency, with the invoiced and credited amounts under it */
function TotalsCard({ row }: { row: BillingSummaryRow }) {
  const usd = row.currency === 'USD'
  return (
    <Card className={cn('gap-0 py-0 shadow-sm', usd ? 'border-blue-200 bg-blue-50/70' : 'border-emerald-200 bg-emerald-50/70')}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm',
              usd ? 'bg-brand-blue' : 'bg-emerald-600',
            )}
          >
            {usd ? <span className="text-sm font-extrabold tracking-wide">USD</span> : <Banknote className="h-6 w-6" aria-hidden="true" />}
          </div>
          <div className="min-w-0">
            <p className={cn('text-sm font-medium', usd ? 'text-blue-900/70' : 'text-emerald-900/70')}>
              Neto facturado en {usd ? 'dólares' : 'pesos'}
            </p>
            <p className={cn('whitespace-nowrap text-[28px] font-extrabold leading-tight tracking-tight tabular-nums', usd ? 'text-brand-navy' : 'text-emerald-900')}>
              <CountUp value={row.net} format={(n) => formatMoney(n, row.currency)} />
            </p>
          </div>
        </div>
        <div className={cn('mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-[13px]', usd ? 'border-blue-200 text-blue-900/80' : 'border-emerald-200 text-emerald-900/80')}>
          <span>
            Facturado <b className="font-semibold tabular-nums">{formatMoney(row.invoiceTotal, row.currency)}</b> · {row.invoiceCount}{' '}
            {row.invoiceCount === 1 ? 'factura' : 'facturas'}
          </span>
          <span>
            Notas de crédito <b className="font-semibold tabular-nums text-red-700">− {formatMoney(row.creditNoteTotal, row.currency)}</b> ·{' '}
            {row.creditNoteCount} {row.creditNoteCount === 1 ? 'nota' : 'notas'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

const PAGE_SIZE = 25
/** New files from the folder agent show up without reloading the page */
const REFRESH_MS = 60_000

export default function FacturacionPage() {
  const { confirm } = useConfirm()
  const fileInput = useRef<HTMLInputElement>(null)

  const [result, setResult] = useState<BillingListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [rereading, setRereading] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<BillingTab>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [currency, setCurrency] = useState<BillingCurrency | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState<BillingSort>('numero_desc')
  const [clientFilter, setClientFilter] = useState<PickedClient | null>(null)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)
  const [editing, setEditing] = useState<BillingDocument | null>(null)
  const [preview, setPreview] = useState<PdfRequest | null>(null)

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      setResult(await billingService.getAll({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        type: tab === 'factura' || tab === 'nota_credito' ? tab : undefined,
        collection: tab === 'por_cobrar' || tab === 'vencida' ? tab : undefined,
        currency: currency === 'all' ? undefined : currency,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sort,
        clientId: clientFilter?.id,
      }))
    } catch (error) {
      if (!quiet) handleActionError(error, 'Error al cargar la facturación')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [page, debouncedSearch, tab, currency, dateFrom, dateTo, sort, clientFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const timer = setInterval(() => load(true), REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])
  // Any filter change goes back to the first page
  useEffect(() => { setPage(1) }, [debouncedSearch, tab, currency, dateFrom, dateTo, sort, clientFilter])

  const documents = result?.data ?? []
  const meta = result?.meta
  // Documents whose currency could not be read are flagged "Revisar datos" in the table instead of totalled
  const totals = result?.summary.filter((row) => row.currency !== '-') ?? []
  const hasFilters = !!(search || tab !== 'all' || currency !== 'all' || dateFrom || dateTo || clientFilter)
  // Filters folded under the button, apart from the search and the tabs
  const activeFilters = [currency !== 'all', !!dateFrom || !!dateTo, !!clientFilter, sort !== 'numero_desc'].filter(Boolean).length

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const summary = await billingService.upload(Array.from(files))
      const parts = [
        summary.created > 0 && `${summary.created} ${summary.created === 1 ? 'subido' : 'subidos'}`,
        summary.duplicates > 0 && `${summary.duplicates} ya estaban`,
        summary.skipped > 0 && `${summary.skipped} no se subieron`,
      ].filter(Boolean)
      showSnackbar(parts.join(' · '), summary.skipped > 0 ? 'warning' : 'success')
      summary.results
        .filter((r) => r.status === 'skipped')
        .forEach((r) => showSnackbar(`${r.fileName}: ${r.reason}`, 'error'))
      load()
    } catch (error) {
      handleActionError(error, 'No se pudieron subir los archivos')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  /** Reads number, date, client and totals again from the stored files */
  const reread = async (ids?: number[]) => {
    setRereading(true)
    try {
      const summary = await billingService.reprocess(ids)
      if (summary.linkedClients > 0) {
        showSnackbar(
          `${summary.linkedClients} ${summary.linkedClients === 1 ? 'documento vinculado' : 'documentos vinculados'} a clientes de la app`,
          'success',
        )
      }
      if (summary.processed === 0) {
        if (summary.linkedClients === 0) showSnackbar('No hay documentos para volver a leer', 'info')
      } else {
        const message = [
          `${summary.fixed} de ${summary.processed} ${summary.processed === 1 ? 'documento leído' : 'documentos leídos'} correctamente`,
          summary.stillNeedReview > 0 && `${summary.stillNeedReview} para revisar a mano`,
        ].filter(Boolean).join(' · ')
        showSnackbar(message, summary.stillNeedReview > 0 ? 'warning' : 'success')
      }
      if (summary.duplicates > 0) {
        showSnackbar(
          `${summary.duplicates} ${summary.duplicates === 1 ? 'documento aparece repetido' : 'documentos aparecen repetidos'} (mismo tipo y número): buscalos y eliminá la copia`,
          'warning',
        )
      }
      load()
    } catch (error) {
      handleActionError(error, 'No se pudieron volver a leer los documentos')
    } finally {
      setRereading(false)
    }
  }

  const linkClient = async (doc: BillingDocument, client: PickedClient) => {
    try {
      await billingService.update(doc.id, { clientId: client.id })
      showSnackbar(`Vinculado a ${client.name}`, 'success')
      load(true)
    } catch (error) {
      handleActionError(error, 'No se pudo vincular el cliente')
    }
  }

  /** Marks an invoice as collected today, or back to pending */
  const togglePaid = async (doc: BillingDocument) => {
    const paidAt = doc.paidAt ? null : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Montevideo' })
    try {
      await billingService.update(doc.id, { paidAt })
      showSnackbar(paidAt ? `${formatBillingNumber(doc)} marcada como cobrada` : `${formatBillingNumber(doc)} vuelve a estar por cobrar`, 'success')
      load(true)
    } catch (error) {
      handleActionError(error, 'No se pudo actualizar el cobro')
    }
  }

  const showFile = (doc: BillingDocument) =>
    setPreview({
      title: `${BILLING_TYPE_LABELS[doc.type]} ${formatBillingNumber(doc)}${doc.clientName ? ` · ${doc.clientName}` : ''}`,
      fileName: doc.fileName,
      load: () => billingService.getFile(doc),
    })

  const remove = async (doc: BillingDocument) => {
    const ok = await confirm({
      title: `Eliminar ${BILLING_TYPE_LABELS[doc.type].toLowerCase()} ${formatBillingNumber(doc)}`,
      message: 'Se borra de la app (el archivo en la carpeta Ventas NC GROUP no se toca). Si el sincronizador lo vuelve a ver modificado, lo sube de nuevo.',
      variant: 'destructive',
      confirmText: 'Eliminar',
    })
    if (!ok) return
    try {
      await billingService.delete(doc.id)
      showSnackbar('Documento eliminado', 'success')
      load()
    } catch (error) {
      handleActionError(error, 'No se pudo eliminar el documento')
    }
  }

  return (
    <FadeIn>
      <PageHeader
        title="Facturación"
        subtitle="Facturas y notas de crédito juntas. Se suben solas desde la carpeta Ventas NC GROUP."
        icon={Receipt}
        backButton={false}
        actions={
          <>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.xml,application/pdf,text/xml,application/xml"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
            />
            <Button variant="outline" onClick={() => reread()} disabled={rereading} title="Lee de nuevo los archivos marcados con Revisar datos">
              <RefreshCw className={`mr-2 h-4 w-4 ${rereading ? 'animate-spin' : ''}`} /> Volver a leer datos
            </Button>
            <Button onClick={() => fileInput.current?.click()} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" /> {uploading ? 'Subiendo...' : 'Subir archivos'}
            </Button>
          </>
        }
      />

      {totals.length > 0 && (
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          {[...totals]
            .sort((a, b) => (a.currency === 'UYU' ? -1 : b.currency === 'UYU' ? 1 : 0))
            .map((row) => <TotalsCard key={row.currency} row={row} />)}
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0 shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Qué documentos ver">
              {TABS.map((item) => {
                const count = result?.tabCounts?.[item.count]
                const active = tab === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(item.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                      active ? 'bg-brand-navy text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {item.label}
                    {count !== undefined && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 text-xs tabular-nums',
                          active ? 'bg-white/20' : item.value === 'vencida' && count > 0 ? 'bg-red-100 text-red-700' : 'bg-muted',
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-1 items-center gap-2 lg:justify-end">
              <SearchInput
                placeholder="Buscar número, cliente o RUT..."
                value={search}
                onChange={setSearch}
                className="w-full lg:max-w-xs"
              />
              <Button variant={showFilters || activeFilters ? 'secondary' : 'outline'} onClick={() => setShowFilters((v) => !v)} className="shrink-0">
                <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" /> Filtros
                {activeFilters > 0 && <span className="ml-1.5 rounded-full bg-brand-navy px-1.5 text-xs text-white">{activeFilters}</span>}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 lg:flex-row lg:flex-wrap lg:items-center">
              <Select value={currency} onValueChange={(v) => setCurrency(v as BillingCurrency | 'all')}>
                <SelectTrigger className="bg-card lg:w-36" aria-label="Filtrar por moneda"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toda moneda</SelectItem>
                  <SelectItem value="UYU">Pesos</SelectItem>
                  <SelectItem value="USD">Dólares</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as BillingSort)}>
                <SelectTrigger className="bg-card lg:w-64" aria-label="Ordenar"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(BILLING_SORT_LABELS) as BillingSort[]).map((value) => (
                    <SelectItem key={value} value={value}>{BILLING_SORT_LABELS[value]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clientFilter ? (
                <span className="inline-flex h-9 items-center gap-2 rounded-md border bg-[#EAF3FB] px-3 text-sm font-medium text-brand-navy">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  <span className="max-w-48 truncate">{clientFilter.name}</span>
                  <button type="button" aria-label="Quitar filtro de cliente" onClick={() => setClientFilter(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ) : (
                <ClientPicker trigger={<><UserRound className="mr-2 h-4 w-4" />Cliente</>} onSelect={setClientFilter} />
              )}
              <div className="flex items-center gap-2">
                <Input type="date" aria-label="Desde" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40 bg-card" />
                <span className="text-sm text-muted-foreground">a</span>
                <Input type="date" aria-label="Hasta" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40 bg-card" />
              </div>
              {activeFilters > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrency('all')
                    setSort('numero_desc')
                    setClientFilter(null)
                    setDateFrom('')
                    setDateTo('')
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">N.º</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Cobro</TableHead>
                  <TableHead className="w-[96px] pr-4 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Cargando...</TableCell></TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {hasFilters
                        ? 'No hay documentos con esos filtros.'
                        : 'Todavía no hay facturas. Cuando bajes una a la carpeta Ventas NC GROUP aparece acá, o subila con "Subir archivos".'}
                    </TableCell>
                  </TableRow>
                ) : documents.map((doc) => {
                  const creditNote = doc.type === 'nota_credito'
                  const clientName = doc.client?.name ?? doc.clientName
                  return (
                  <TableRow key={doc.id} className="group">
                    <TableCell className="pl-4">
                      <div className={cn('flex items-center gap-1.5 font-mono font-semibold', creditNote && 'text-amber-700')}>
                        {formatBillingNumber(doc)}
                        <span title={doc.source === 'carpeta' ? `Desde la carpeta · ${doc.fileName}` : `Subida a mano · ${doc.fileName}`}>
                          {doc.source === 'carpeta'
                            ? <FolderSync className="h-3 w-3 text-muted-foreground/60" aria-label="Desde la carpeta" />
                            : <Upload className="h-3 w-3 text-muted-foreground/60" aria-label="Subida a mano" />}
                        </span>
                      </div>
                      {creditNote && (
                        <span className="text-xs font-medium text-amber-700">
                          Nota de crédito{doc.referenceNumber ? ` · ref. ${doc.referenceNumber}` : ''}
                        </span>
                      )}
                      {doc.needsReview && (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Revisar datos
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatIsoDate(doc.issueDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                            doc.client ? 'bg-[#EAF3FB] text-brand-blue' : 'bg-amber-100 text-amber-800',
                          )}
                          aria-hidden="true"
                        >
                          {clientName ? initials(clientName) : '?'}
                        </span>
                        <div className="min-w-0">
                          {doc.client ? (
                            <button
                              type="button"
                              className="text-left font-medium hover:text-brand-blue hover:underline"
                              title="Ver solo las facturas de este cliente"
                              onClick={() => setClientFilter({ id: doc.client!.id, name: doc.client!.name })}
                            >
                              {doc.client.name}
                            </button>
                          ) : (
                            <div className="font-medium">{doc.clientName || '-'}</div>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            {doc.clientRut && <span>RUT {doc.clientRut}</span>}
                            {!doc.client && (
                              <>
                                {(doc.clientName || doc.clientRut) && (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Sin vincular</span>
                                )}
                                <ClientPicker
                                  trigger={<span className="text-xs">Vincular cliente</span>}
                                  variant="secondary"
                                  className="h-6 px-2"
                                  onSelect={(client) => linkClient(doc, client)}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'whitespace-nowrap text-right font-mono font-semibold tabular-nums',
                        creditNote ? 'text-red-700' : doc.currency === 'USD' ? 'text-brand-blue' : 'text-foreground',
                      )}
                    >
                      {creditNote && doc.total !== null ? '− ' : ''}{formatMoney(doc.total !== null ? Math.abs(doc.total) : null, doc.currency)}
                    </TableCell>
                    <TableCell>
                      <PaymentCell doc={doc} onToggle={togglePaid} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Ver archivo" aria-label={`Ver ${doc.fileName}`} onClick={() => showFile(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Más acciones">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled={rereading} onClick={() => reread([doc.id])}>
                              <RefreshCw className="mr-2 h-4 w-4" /> Volver a leer datos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditing(doc)}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar datos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => remove(doc)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {meta && meta.total > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{meta.total} {meta.total === 1 ? 'documento' : 'documentos'}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>Página {meta.page} de {meta.lastPage}</span>
                <Button variant="outline" size="icon" aria-label="Página siguiente" disabled={page >= meta.lastPage} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BillingDocumentDialog document={editing} onClose={() => setEditing(null)} onSaved={() => load()} />
      <PdfPreviewDialog request={preview} onClose={() => setPreview(null)} />
    </FadeIn>
  )
}
