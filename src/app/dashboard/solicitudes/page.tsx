'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Inbox, Paperclip } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showSnackbar } from '@/components/ui/snackbar'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { MailAccountsCard } from '@/components/solicitudes/mail-accounts-card'

import { useDebounce } from '@/hooks/use-debounce'
import { handleActionError } from '@/lib/error-handler'
import {
  SOLICITUD_STATUS_CLASSES,
  SOLICITUD_STATUS_LABELS,
  Solicitud,
  SolicitudStatus,
  SolicitudesSummary,
  formatDateTime,
  solicitudesService,
} from '@/services/solicitudes.service'
import { PaginationMeta } from '@/types/api'

const PAGE_SIZE = 20

// useSearchParams needs a Suspense boundary for the static build
export default function SolicitudesPage() {
  return (
    <Suspense>
      <SolicitudesContent />
    </Suspense>
  )
}

function SolicitudesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [items, setItems] = useState<Solicitud[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, lastPage: 1, limit: PAGE_SIZE })
  const [summary, setSummary] = useState<SolicitudesSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [fromFilter, setFromFilter] = useState('')
  const [status, setStatus] = useState<SolicitudStatus | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const debouncedFrom = useDebounce(fromFilter, 300)

  const loadPage = useCallback(
    async (page: number) => {
      setIsLoading(true)
      try {
        const response = await solicitudesService.getAll({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
          from: debouncedFrom || undefined,
          status: status === 'all' ? undefined : status,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })
        setItems(response.data)
        setMeta(response.meta)
      } catch (error) {
        handleActionError(error, 'Error al cargar las solicitudes')
      } finally {
        setIsLoading(false)
      }
    },
    [debouncedSearch, debouncedFrom, status, dateFrom, dateTo],
  )

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await solicitudesService.getSummary())
    } catch (error) {
      console.error('Error loading solicitudes summary:', error)
    }
  }, [])

  useEffect(() => {
    loadPage(1)
  }, [loadPage])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  // Result of the Google OAuth redirect
  useEffect(() => {
    const result = searchParams.get('mail')
    if (!result) return
    const detail = searchParams.get('detalle')
    if (result === 'conectado') showSnackbar(`Casilla conectada${detail ? `: ${detail}` : ''}`, 'success')
    else if (result === 'cancelado') showSnackbar('Se canceló la conexión con Google', 'info')
    else showSnackbar(detail || 'No se pudo conectar la casilla', 'error')
    router.replace('/dashboard/solicitudes')
  }, [searchParams, router])

  const refresh = () => {
    loadPage(meta.page)
    loadSummary()
  }

  const columns: DataTableColumn<Solicitud>[] = [
    {
      key: 'subject',
      header: 'Solicitud',
      className: 'min-w-[280px]',
      render: (item) => (
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-1.5 size-2 shrink-0 rounded-full ${item.unread ? 'bg-brand-blue' : 'bg-transparent'}`}
            aria-label={item.unread ? 'Sin leer' : undefined}
          />
          <div className="min-w-0">
            <div className={`truncate text-brand-navy ${item.unread ? 'font-bold' : 'font-semibold'}`}>
              {item.subject || '(sin asunto)'}
            </div>
            <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.snippet}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'from',
      header: 'Remitente',
      className: 'min-w-[200px]',
      render: (item) => (
        <div>
          <div className="text-sm">{item.fromName || item.fromEmail || '—'}</div>
          {item.fromName && <div className="text-xs text-muted-foreground">{item.fromEmail}</div>}
        </div>
      ),
    },
    {
      key: 'receivedAt',
      header: 'Recibida',
      className: 'w-[140px]',
      render: (item) => (
        <div className="text-sm">
          {formatDateTime(item.receivedAt)}
          {item.messagesCount > 1 && (
            <div className="text-xs text-muted-foreground">{item.messagesCount} mensajes</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      className: 'w-[130px]',
      render: (item) => (
        <Badge variant="outline" className={`rounded-full font-semibold ${SOLICITUD_STATUS_CLASSES[item.status]}`}>
          {SOLICITUD_STATUS_LABELS[item.status]}
        </Badge>
      ),
    },
    {
      key: 'assignee',
      header: 'Responsable',
      className: 'w-[140px]',
      render: (item) => <span className="text-sm">{item.assignee || <span className="text-muted-foreground">—</span>}</span>,
    },
  ]

  const statusCards: Array<{ key: SolicitudStatus; tone: string }> = [
    { key: SolicitudStatus.NEW, tone: 'text-brand-blue' },
    { key: SolicitudStatus.IN_PROGRESS, tone: 'text-amber-600' },
    { key: SolicitudStatus.RESOLVED, tone: 'text-emerald-600' },
    { key: SolicitudStatus.CANCELLED, tone: 'text-zinc-500' },
  ]

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <PageHeader
          title="Solicitudes"
          subtitle="Pedidos que llegan por mail con la etiqueta Solicitudes"
          backButton={false}
        />
      </FadeIn>

      <FadeIn delay={50}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statusCards.map((card) => {
            const active = status === card.key
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setStatus(active ? 'all' : card.key)}
                className={`rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md ${
                  active ? 'border-brand-blue ring-2 ring-brand-blue/20' : ''
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {SOLICITUD_STATUS_LABELS[card.key]}
                </div>
                <div className={`mt-1 text-2xl font-extrabold ${card.tone}`}>{summary?.byStatus[card.key] ?? '—'}</div>
                {card.key === SolicitudStatus.NEW && summary && summary.unread > 0 && (
                  <div className="text-xs text-muted-foreground">{summary.unread} sin leer</div>
                )}
              </button>
            )
          })}
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <Card>
          <CardHeader className="gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                <span>Bandeja de solicitudes</span>
                <Badge variant="outline">{meta.total} solicitudes</Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Las respuestas del mismo hilo se agregan a la solicitud existente.
              </CardDescription>
            </div>
            <div className="grid gap-3 md:grid-cols-[2fr_1.3fr_1fr_1fr_1fr]">
              <SearchInput placeholder="Buscar en asunto, remitente o contenido..." value={searchTerm} onChange={setSearchTerm} />
              <Input placeholder="Remitente (mail o nombre)" value={fromFilter} onChange={(e) => setFromFilter(e.target.value)} />
              <Select value={status} onValueChange={(value) => setStatus(value as SolicitudStatus | 'all')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.values(SolicitudStatus).map((value) => (
                    <SelectItem key={value} value={value}>
                      {SOLICITUD_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" aria-label="Desde" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" aria-label="Hasta" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={items}
              isLoading={isLoading}
              onRowClick={(item) => router.push(`/dashboard/solicitudes/${item.id}`)}
              pagination={{
                page: meta.page,
                limit: meta.limit,
                total: meta.total,
                totalPages: meta.lastPage,
                onPageChange: (page) => loadPage(page),
              }}
              emptyMessage="Todavía no hay solicitudes. Etiquetá un mail como Solicitudes en tu correo."
            />
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={150}>
        <MailAccountsCard onSynced={refresh} />
      </FadeIn>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" />
        Los adjuntos quedan en el correo y se descargan desde el detalle de cada solicitud.
      </p>
    </div>
  )
}
