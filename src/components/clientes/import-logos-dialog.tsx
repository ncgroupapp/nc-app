'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, FolderOpen, ImagePlus, Loader2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showSnackbar } from '@/components/ui/snackbar'
import { findClient, nameFromFileName } from '@/lib/client-name-match'
import { prepareLogo } from '@/lib/prepare-logo'
import { cn } from '@/lib/utils'
import { clientesService } from '@/services/clientes.service'
import { Cliente } from '@/types/cliente'

const IMAGE = /\.(png|jpe?g|webp)$/i
const SKIP = 'skip'

type Status = 'pending' | 'uploading' | 'done' | 'error'

interface Row {
  key: string
  file: File
  preview: string
  clientId: string
  /** The client was found from the file name (not chosen by hand) */
  auto: boolean
  status: Status
  error?: string
}

interface ImportLogosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after uploading, to refresh the list */
  onDone: () => void
}

/** Uploads many client logos at once, matching each file to a client by its name. */
export function ImportLogosDialog({ open, onOpenChange, onDone }: ImportLogosDialogProps) {
  const filesInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const [clients, setClients] = useState<Cliente[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingClients(true)
    clientesService
      .getAll({ limit: 1000 })
      .then((response) => setClients(response.data))
      .catch(() => showSnackbar('No se pudo cargar la lista de clientes', 'error'))
      .finally(() => setLoadingClients(false))
  }, [open])

  // Previews are freed when the list is cleared or the dialog goes away
  const previews = useRef<string[]>([])
  const clearRows = () => {
    previews.current.forEach((url) => URL.revokeObjectURL(url))
    previews.current = []
    setRows([])
  }
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), [])

  // The folder picker is not a standard attribute of <input>
  useEffect(() => {
    folderInput.current?.setAttribute('webkitdirectory', '')
  }, [open])

  const sortedClients = useMemo(() => [...clients].sort((a, b) => a.name.localeCompare(b.name, 'es')), [clients])
  const clientById = useMemo(() => new Map(clients.map((client) => [String(client.id), client])), [clients])

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const images = Array.from(list).filter((file) => IMAGE.test(file.name))
    if (images.length === 0) {
      showSnackbar('No se encontraron imágenes PNG o JPG', 'warning')
      return
    }
    setRows((previous) => {
      const known = new Set(previous.map((row) => row.key))
      const added = images
        .filter((file) => !known.has(`${file.name}:${file.size}`))
        .map((file): Row => {
          const match = findClient(nameFromFileName(file.name), clients)
          const preview = URL.createObjectURL(file)
          previews.current.push(preview)
          return {
            key: `${file.name}:${file.size}`,
            file,
            preview,
            clientId: match ? String(match.id) : SKIP,
            auto: Boolean(match),
            status: 'pending',
          }
        })
      return [...previous, ...added].sort((a, b) => a.file.name.localeCompare(b.file.name, 'es'))
    })
    if (filesInput.current) filesInput.current.value = ''
    if (folderInput.current) folderInput.current.value = ''
  }

  const setClient = (key: string, clientId: string) =>
    setRows((previous) => previous.map((row) => (row.key === key ? { ...row, clientId, auto: false, status: 'pending', error: undefined } : row)))

  const toUpload = rows.filter((row) => row.clientId !== SKIP && row.status !== 'done')
  const matched = rows.filter((row) => row.clientId !== SKIP).length
  const assignedTwice = useMemo(() => {
    const count = new Map<string, number>()
    rows.forEach((row) => row.clientId !== SKIP && count.set(row.clientId, (count.get(row.clientId) ?? 0) + 1))
    return new Set([...count].filter(([, n]) => n > 1).map(([id]) => id))
  }, [rows])

  const upload = async () => {
    setUploading(true)
    let ok = 0
    for (const row of toUpload) {
      setRows((previous) => previous.map((r) => (r.key === row.key ? { ...r, status: 'uploading' } : r)))
      try {
        await clientesService.uploadLogo(row.clientId, await prepareLogo(row.file))
        ok++
        setRows((previous) => previous.map((r) => (r.key === row.key ? { ...r, status: 'done' } : r)))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo subir'
        setRows((previous) => previous.map((r) => (r.key === row.key ? { ...r, status: 'error', error: message } : r)))
      }
    }
    setUploading(false)
    if (ok > 0) {
      showSnackbar(`${ok} ${ok === 1 ? 'logo cargado' : 'logos cargados'}`, 'success')
      onDone()
    }
  }

  const close = (value: boolean) => {
    if (uploading) return
    if (!value) clearRows()
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar logos de clientes</DialogTitle>
          <DialogDescription>
            Elegí la carpeta con los logos (o varios archivos). Cada logo se asigna al cliente por el nombre del archivo,
            por ejemplo &quot;ASSE.png&quot; o &quot;Hospital de Clinicas.jpg&quot;. Revisá la lista antes de subir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <input ref={folderInput} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
          <input ref={filesInput} type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => addFiles(e.target.files)} />
          <Button type="button" onClick={() => folderInput.current?.click()} disabled={loadingClients || uploading}>
            <FolderOpen className="mr-2 h-4 w-4" /> Elegir carpeta
          </Button>
          <Button type="button" variant="outline" onClick={() => filesInput.current?.click()} disabled={loadingClients || uploading}>
            <ImagePlus className="mr-2 h-4 w-4" /> Elegir archivos
          </Button>
          {loadingClients && (
            <span className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando clientes...
            </span>
          )}
        </div>

        {rows.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              {rows.length} {rows.length === 1 ? 'imagen' : 'imágenes'} · <b className="text-foreground">{matched}</b> con cliente
              {rows.length - matched > 0 && <> · {rows.length - matched} sin asignar (no se suben)</>}
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
              <ul className="divide-y">
                {rows.map((row) => {
                  const client = clientById.get(row.clientId)
                  return (
                    <li key={row.key} className="flex flex-wrap items-center gap-3 px-3 py-2 sm:flex-nowrap">
                      <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded border bg-white p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the file */}
                        <img src={row.preview} alt="" className="max-h-full max-w-full object-contain" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium" title={row.file.name}>{row.file.name}</span>
                        <span className={cn('block text-xs', row.clientId === SKIP ? 'text-amber-700' : 'text-muted-foreground')}>
                          {row.clientId === SKIP
                            ? 'No se encontró el cliente: elegilo o se saltea'
                            : row.auto
                              ? 'Reconocido por el nombre del archivo'
                              : 'Elegido a mano'}
                          {client?.logoUpdatedAt && row.status !== 'done' && ' · reemplaza el logo actual'}
                          {assignedTwice.has(row.clientId) && ' · ⚠ otro archivo va al mismo cliente'}
                        </span>
                      </span>
                      <Select value={row.clientId} onValueChange={(value) => setClient(row.key, value)} disabled={uploading || row.status === 'done'}>
                        <SelectTrigger className="w-full sm:w-64" aria-label={`Cliente para ${row.file.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SKIP}>— No subir —</SelectItem>
                          {sortedClients.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="flex w-5 shrink-0 justify-center" aria-live="polite">
                        {row.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-brand-blue" aria-label="Subiendo" />}
                        {row.status === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Cargado" />}
                        {row.status === 'error' && <XCircle className="h-4 w-4 text-red-600" aria-label={row.error} />}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => close(false)} disabled={uploading}>
            {rows.length > 0 && toUpload.length === 0 ? 'Cerrar' : 'Cancelar'}
          </Button>
          <Button type="button" onClick={upload} disabled={uploading || toUpload.length === 0}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Subir {toUpload.length > 0 ? `${toUpload.length} ${toUpload.length === 1 ? 'logo' : 'logos'}` : 'logos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
