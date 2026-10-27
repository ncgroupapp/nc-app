'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, Download, FilePlus2, Loader2, Mail, Paperclip, Save } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { showSnackbar } from '@/components/ui/snackbar'
import { Textarea } from '@/components/ui/textarea'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'

import { handleActionError } from '@/lib/error-handler'
import {
  SOLICITUD_STATUS_CLASSES,
  SOLICITUD_STATUS_LABELS,
  Solicitud,
  SolicitudAttachment,
  SolicitudMessage,
  SolicitudStatus,
  buildLicitacionUrl,
  formatDateTime,
  formatFileSize,
  solicitudesService,
} from '@/services/solicitudes.service'

export default function SolicitudDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<SolicitudStatus>(SolicitudStatus.NEW)
  const [assignee, setAssignee] = useState('')
  const [notes, setNotes] = useState('')

  const applySolicitud = (data: Solicitud) => {
    setSolicitud(data)
    setStatus(data.status)
    setAssignee(data.assignee ?? '')
    setNotes(data.notes ?? '')
  }

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      applySolicitud(await solicitudesService.getById(id))
    } catch (error) {
      handleActionError(error, 'No se pudo cargar la solicitud')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (Number.isFinite(id)) load()
  }, [id, load])

  const isDirty =
    solicitud !== null &&
    (status !== solicitud.status || assignee.trim() !== (solicitud.assignee ?? '') || notes.trim() !== (solicitud.notes ?? ''))

  const handleSave = async () => {
    setIsSaving(true)
    try {
      applySolicitud(await solicitudesService.update(id, { status, assignee: assignee.trim() || null, notes: notes.trim() || null }))
      showSnackbar('Solicitud actualizada', 'success')
    } catch (error) {
      handleActionError(error, 'No se pudo guardar la solicitud')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && !solicitud) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!solicitud) {
    return <p className="text-muted-foreground">No se encontró la solicitud.</p>
  }

  const messages = solicitud.messages ?? []

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <PageHeader
          title={solicitud.subject || '(sin asunto)'}
          subtitle={
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`rounded-full font-semibold ${SOLICITUD_STATUS_CLASSES[solicitud.status]}`}>
                {SOLICITUD_STATUS_LABELS[solicitud.status]}
              </Badge>
              <span>
                De {solicitud.fromName ? `${solicitud.fromName} <${solicitud.fromEmail}>` : solicitud.fromEmail} ·{' '}
                {formatDateTime(solicitud.receivedAt)}
              </span>
            </span>
          }
        />
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <FadeIn delay={50}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-brand-navy">
                <Mail className="h-4 w-4" /> Historial del hilo
                <Badge variant="outline">{messages.length} {messages.length === 1 ? 'mensaje' : 'mensajes'}</Badge>
              </CardTitle>
              <CardDescription>Recibida en {solicitud.mailAccount?.email ?? 'la casilla conectada'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.map((message, index) => (
                <MessageItem key={message.id} message={message} isOriginal={index === 0} />
              ))}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={100}>
          <Card className="lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle className="text-base text-brand-navy">Gestión</CardTitle>
              <CardDescription>Estado, responsable y notas internas (no se envían al remitente).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as SolicitudStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SolicitudStatus).map((value) => (
                      <SelectItem key={value} value={value}>
                        {SOLICITUD_STATUS_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assignee">Responsable</Label>
                <div className="flex gap-2">
                  <Input id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Sin asignar" />
                  {!assignee && (
                    <Button type="button" variant="outline" onClick={() => setAssignee('Admin')}>
                      Asignarme
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notas internas</Label>
                <Textarea id="notes" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: pedir precio a Ayala, responder antes del viernes…" />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={!isDirty || isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar cambios
              </Button>
              <Button asChild variant="outline" className="w-full border-brand-navy/20 text-brand-navy">
                <Link href={buildLicitacionUrl(solicitud)}>
                  <FilePlus2 className="mr-2 h-4 w-4" /> Armar licitación
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Abre una licitación nueva con el número de compra, la fecha y el cliente precargados. Al crearla, la
                solicitud pasa a En proceso.
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}

function MessageItem({ message, isOriginal }: { message: SolicitudMessage; isOriginal: boolean }) {
  const [showOriginal, setShowOriginal] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const handleDownload = async (attachment: SolicitudAttachment) => {
    setDownloadingId(attachment.id)
    try {
      await solicitudesService.downloadAttachment(attachment)
    } catch (error) {
      handleActionError(error, 'No se pudo descargar el adjunto')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className={`rounded-xl border p-4 ${message.outgoing ? 'border-brand-blue/20 bg-[#F4F8FC]' : 'bg-white'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div
            className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
              message.outgoing ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-navy text-white'
            }`}
          >
            {message.outgoing ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
          </div>
          <div>
            <div className="font-semibold text-brand-navy">
              {message.fromName || message.fromEmail}
              {isOriginal && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-brand-navy">Original</span>}
              {message.outgoing && <span className="ml-2 text-xs font-medium text-brand-blue">Respuesta enviada</span>}
            </div>
            <div className="text-xs text-muted-foreground">
              {message.fromName && `${message.fromEmail} · `}
              Para: {message.toRecipients || '—'}
              {message.ccRecipients && ` · CC: ${message.ccRecipients}`}
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{formatDateTime(message.sentAt)}</span>
      </div>

      {showOriginal && message.bodyHtml ? (
        // Sandboxed iframe: shows the original formatting without running any script from the mail
        <iframe
          title={`Mail ${message.id}`}
          sandbox=""
          srcDoc={message.bodyHtml}
          className="mt-3 h-[420px] w-full rounded-lg border bg-white"
        />
      ) : (
        <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-700">
          {message.bodyText?.trim() || '(sin texto)'}
        </div>
      )}
      {message.bodyHtml && (
        <button type="button" className="mt-2 text-xs font-medium text-brand-blue hover:underline" onClick={() => setShowOriginal((v) => !v)}>
          {showOriginal ? 'Ver como texto' : 'Ver con formato original'}
        </button>
      )}

      {message.attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          {message.attachments.map((attachment) => (
            <button
              key={attachment.id}
              type="button"
              onClick={() => handleDownload(attachment)}
              className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm hover:border-brand-blue/40"
            >
              {downloadingId === attachment.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />
              ) : (
                <Paperclip className="h-4 w-4 text-brand-blue" />
              )}
              <span className="max-w-[220px] truncate">{attachment.filename}</span>
              <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
