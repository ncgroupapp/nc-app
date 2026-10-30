'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { clientesService } from '@/services/clientes.service'

/** Object URLs of the logos already downloaded, by client and version */
const cache = new Map<string, Promise<string | null>>()

function loadLogo(id: string | number, version: string): Promise<string | null> {
  const key = `${id}:${version}`
  let url = cache.get(key)
  if (!url) {
    url = clientesService
      .getLogo(id)
      .then((blob) => URL.createObjectURL(blob))
      .catch(() => null)
    cache.set(key, url)
  }
  return url
}

const SMALL_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y'])

/** "Hospital de Clínicas" → "HC", "Administración de los Servicios…" → "AS", "ASSE" → "AS" */
const initials = (name: string) => {
  const words = name.split(/\s+/).filter((word) => word.length > 1 && !SMALL_WORDS.has(word.toLowerCase()))
  return (words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : name.slice(0, 2)).toUpperCase()
}

interface ClientLogoProps {
  client: { id: string | number; name: string; logoUpdatedAt?: string | null }
  /** A logo not saved yet (preview while editing) */
  previewUrl?: string | null
  className?: string
}

/** The client's logo in a fixed box (contained, never distorted), or its initials when it has none. */
export function ClientLogo({ client, previewUrl, className }: ClientLogoProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setUrl(null)
    if (!previewUrl && client.logoUpdatedAt) {
      loadLogo(client.id, client.logoUpdatedAt).then((loaded) => {
        if (!cancelled) setUrl(loaded)
      })
    }
    return () => {
      cancelled = true
    }
  }, [client.id, client.logoUpdatedAt, previewUrl])

  const src = previewUrl ?? url
  return (
    <span className={cn('flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md', !src && 'bg-[#E6F7F9]', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob URL from the API, not a static asset
        <img src={src} alt={`Logo de ${client.name}`} className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="text-[11px] font-bold text-brand-navy">{initials(client.name)}</span>
      )}
    </span>
  )
}
