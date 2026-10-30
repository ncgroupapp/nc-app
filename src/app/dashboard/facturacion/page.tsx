'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderSync,
  MoreHorizontal,
  Pencil,
  Receipt,
  RefreshCw,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
import { BillingDocumentDialog } from '@/components/facturacion/billing-document-dialog'
import { ClientPicker, PickedClient } from '@/components/facturacion/client-picker'
import { PdfPreviewDialog, PdfRequest } from '@/components/remitos/pdf-preview-dialog'

import { useConfirm } from '@/hooks/use-confirm'
import { useDebounce } from '@/hooks/use-debounce'
import { handleActionError } from '@/lib/error-handler'
import { formatIsoDate } from '@/services/remitos.service'
import {
  BILLING_SORT_LABELS,
  BILLING_TYPE_CLASSES,
  BILLING_TYPE_LABELS,
  CLIENT_MATCH_LABELS,
  BillingCurrency,
  BillingDocument,
  BillingDocumentType,
  BillingListResponse,
  BillingSort,
  billingService,
  formatBillingNumber,
  formatMoney,
} from '@/services/billing.service'

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
  const [type, setType] = useState<BillingDocumentType | 'all'>('all')
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
        type: type === 'all' ? undefined : type,
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
  }, [page, debouncedSearch, type, currency, dateFrom, dateTo, sort, clientFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const timer = setInterval(() => load(true), REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])
  // Any filter change goes back to the first page
  useEffect(() => { setPage(1) }, [debouncedSearch, type, currency, dateFrom, dateTo, sort, clientFilter])

  const documents = result?.data ?? []
  const gaps = result?.gaps ?? []
  const meta = result?.meta
  // Documents whose currency could not be read are flagged "Revisar datos" in the table instead of totalled
  const totals = result?.summary.filter((row) => row.currency !== '-') ?? []
  const hasFilters = !!(search || type !== 'all' || currency !== 'all' || dateFrom || dateTo || clientFilter)

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
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          {totals.map((row) => (
            <Card key={row.currency} className="py-4">
              <CardContent className="grid grid-cols-3 gap-3 px-4">
                <div>
                  <p className="text-xs text-muted-foreground">Facturado {row.currency}</p>
                  <p className="text-lg font-semibold tabular-nums">{formatMoney(row.invoiceTotal, row.currency)}</p>
                  <p className="text-xs text-muted-foreground">{row.invoiceCount} {row.invoiceCount === 1 ? 'factura' : 'facturas'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Notas de crédito</p>
                  <p className="text-lg font-semibold tabular-nums text-amber-700">− {formatMoney(row.creditNoteTotal, row.currency)}</p>
                  <p className="text-xs text-muted-foreground">{row.creditNoteCount} {row.creditNoteCount === 1 ? 'nota' : 'notas'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Neto</p>
                  <p className="text-lg font-bold tabular-nums text-brand-navy">{formatMoney(row.net, row.currency)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <SearchInput
              placeholder="Buscar por número, cliente, RUT o archivo..."
              value={search}
              onChange={setSearch}
              className="lg:max-w-sm"
            />
            <Select value={type} onValueChange={(v) => setType(v as BillingDocumentType | 'all')}>
              <SelectTrigger className="lg:w-48" aria-label="Filtrar por tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Facturas y notas de crédito</SelectItem>
                <SelectItem value="factura">Solo facturas</SelectItem>
                <SelectItem value="nota_credito">Solo notas de crédito</SelectItem>
              </SelectContent>
            </Select>
            <Select value={currency} onValueChange={(v) => setCurrency(v as BillingCurrency | 'all')}>
              <SelectTrigger className="lg:w-36" aria-label="Filtrar por moneda"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda moneda</SelectItem>
                <SelectItem value="UYU">Pesos</SelectItem>
                <SelectItem value="USD">Dólares</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as BillingSort)}>
              <SelectTrigger className="lg:w-64" aria-label="Ordenar"><SelectValue /></SelectTrigger>
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
              <Input type="date" aria-label="Desde" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
              <span className="text-sm text-muted-foreground">a</span>
              <Input type="date" aria-label="Hasta" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
            </div>
          </div>

          {gaps.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Faltan números en la numeración
              </p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {gaps.map((gap) => (
                  <li key={`${gap.type}-${gap.series ?? ''}`}>
                    {gap.type === 'factura' ? 'Facturas' : 'Notas de crédito'}{gap.series ? ` serie ${gap.series}` : ''}:{' '}
                    {gap.missing.join(', ')}
                    {gap.missingCount > gap.missing.length && ` y ${gap.missingCount - gap.missing.length} más`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>N.º</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead className="w-[110px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Cargando...</TableCell></TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      {hasFilters
                        ? 'No hay documentos con esos filtros.'
                        : 'Todavía no hay facturas. Cuando bajes una a la carpeta Ventas NC GROUP aparece acá, o subila con "Subir archivos".'}
                    </TableCell>
                  </TableRow>
                ) : documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Badge variant="outline" className={BILLING_TYPE_CLASSES[doc.type]}>{BILLING_TYPE_LABELS[doc.type]}</Badge>
                      {doc.needsReview && (
                        <span className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Revisar datos
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {formatBillingNumber(doc)}
                      {doc.referenceNumber && (
                        <span className="block font-sans text-xs font-normal text-muted-foreground">Ref. factura {doc.referenceNumber}</span>
                      )}
                    </TableCell>
                    <TableCell>{formatIsoDate(doc.issueDate)}</TableCell>
                    <TableCell>
                      {doc.client ? (
                        <>
                          <button
                            type="button"
                            className="text-left font-medium hover:text-brand-blue hover:underline"
                            title="Ver solo las facturas de este cliente"
                            onClick={() => setClientFilter({ id: doc.client!.id, name: doc.client!.name })}
                          >
                            {doc.client.name}
                          </button>
                          <div className="text-xs text-muted-foreground">
                            {doc.clientMatch ? CLIENT_MATCH_LABELS[doc.clientMatch] : 'Vinculado'}
                            {doc.clientRut && ` · RUT ${doc.clientRut}`}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium">{doc.clientName || '-'}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            {(doc.clientName || doc.clientRut) && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Sin vincular</span>
                            )}
                            <ClientPicker
                              trigger={<span className="text-xs">Vincular cliente</span>}
                              variant="secondary"
                              className="h-6 px-2"
                              onSelect={(client) => linkClient(doc, client)}
                            />
                          </div>
                          {doc.clientRut && <div className="text-xs text-muted-foreground">RUT {doc.clientRut}</div>}
                        </>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${doc.type === 'nota_credito' ? 'text-amber-700' : ''}`}>
                      {doc.type === 'nota_credito' && doc.total !== null ? '− ' : ''}{formatMoney(doc.total !== null ? Math.abs(doc.total) : null, doc.currency)}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground" title={doc.fileName}>
                        {doc.source === 'carpeta' ? <><FolderSync className="h-3.5 w-3.5" aria-hidden="true" /> Carpeta</> : <><Upload className="h-3.5 w-3.5" aria-hidden="true" /> Manual</>}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
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
                ))}
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
