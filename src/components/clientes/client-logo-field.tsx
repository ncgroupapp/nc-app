'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { showSnackbar } from '@/components/ui/snackbar'
import { prepareLogo } from '@/lib/prepare-logo'
import { Cliente } from '@/types/cliente'
import { ClientLogo } from './client-logo'

/** What to do with the logo when the client is saved */
export type LogoChange = { action: 'upload'; logo: Blob } | { action: 'remove' } | null

interface ClientLogoFieldProps {
  client: Pick<Cliente, 'id' | 'name' | 'logoUpdatedAt'> | null
  name: string
  value: LogoChange
  onChange: (change: LogoChange) => void
}

/** Logo picker for the client form: trims empty margins and shows how it looks before saving. */
export function ClientLogoField({ client, name, value, onChange }: ClientLogoFieldProps) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (value?.action !== 'upload') {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(value.logo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const pick = async (file: File | undefined) => {
    if (!file) return
    setProcessing(true)
    try {
      onChange({ action: 'upload', logo: await prepareLogo(file) })
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : 'No se pudo leer la imagen', 'error')
    } finally {
      setProcessing(false)
      if (input.current) input.current.value = ''
    }
  }

  const hasLogo = value?.action === 'upload' || (value?.action !== 'remove' && Boolean(client?.logoUpdatedAt))
  const shown = { id: client?.id ?? 'nuevo', name: name || client?.name || 'Cliente', logoUpdatedAt: value?.action === 'remove' ? null : client?.logoUpdatedAt }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center">
      <ClientLogo client={shown} previewUrl={preview} className="h-16 w-28 rounded-md border bg-white" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Logo del cliente</p>
        <p className="text-xs text-muted-foreground">
          Aparece en la hoja de cotización, al lado del nombre. PNG o JPG; los bordes vacíos se recortan solos.
        </p>
      </div>
      <div className="flex gap-2">
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <Button type="button" variant="outline" size="sm" disabled={processing} onClick={() => input.current?.click()}>
          {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {hasLogo ? 'Cambiar' : 'Subir logo'}
        </Button>
        {hasLogo && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600"
            aria-label="Quitar logo"
            onClick={() => onChange(client?.logoUpdatedAt ? { action: 'remove' } : null)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
