'use client'

import { useState } from 'react'
import { FileText, ExternalLink, Files, Image } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface ManualFilesCellProps {
    urls: string[]
}

/** Strips the Firebase timestamp prefix: `1773179814010_originalname.pdf` → `originalname.pdf` */
function cleanFileName(name: string): string {
    return name.replace(/^\d+_/, '')
}

function getFileName(url: string, fallback: string): string {
    try {
        const match = url.match(/\/o\/(.+?)\?/)
        if (match) return cleanFileName(decodeURIComponent(match[1]).split('/').pop() || fallback)
    } catch { /* ignore */ }
    return fallback
}

function isPdf(name: string) {
    return name.toLowerCase().endsWith('.pdf')
}

function isImage(name: string) {
    return /\.(jpe?g|png|gif|webp)$/i.test(name)
}

function FileIcon({ name, className }: { name: string; className?: string }) {
    if (isPdf(name)) return <FileText className={className} />
    if (isImage(name)) return <Image className={className} />
    return <Files className={className} />
}

/**
 * Image with an animated shimmer shown while it's loading.
 * Fades in smoothly once the browser has decoded the src.
 */
function ImageWithLoader({
    src,
    alt,
    className,
    containerClassName,
}: {
    src: string
    alt: string
    className?: string
    containerClassName?: string
}) {
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState(false)

    return (
        <div className={`relative overflow-hidden ${containerClassName ?? ''}`}>
            {/* Shimmer skeleton shown while image is loading */}
            {!loaded && !error && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
            )}

            {/* Fallback icon if image fails to load */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Image className="h-4 w-4 text-muted-foreground" />
                </div>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className ?? ''}`}
            />
        </div>
    )
}

export function ManualFilesCell({ urls }: ManualFilesCellProps) {
    const [open, setOpen] = useState(false)

    if (!urls || urls.length === 0) {
        return <span className="text-muted-foreground/50 italic text-xs">Sin archivos</span>
    }

    const firstName = getFileName(urls[0], 'Archivo 1')
    const extraCount = urls.length - 1

    return (
        <>
            {/* ─── Inline cell view ─── */}
            <div className="flex items-center gap-2">
                <a
                    href={urls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline text-sm min-w-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <FileIcon name={firstName} className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[140px]">{firstName}</span>
                </a>

                {extraCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                            e.stopPropagation()
                            setOpen(true)
                        }}
                    >
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs pointer-events-none">
                            +{extraCount}
                        </Badge>
                        Ver todos
                    </Button>
                )}
            </div>

            {/* ─── Preview modal ─── */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[520px]" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Files className="h-5 w-5" />
                            Archivos adjuntos
                            <Badge variant="outline" className="ml-1">{urls.length}</Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-2 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                        {urls.map((url, i) => {
                            const name = getFileName(url, `Archivo ${i + 1}`)
                            const img = isImage(name)

                            return (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 group"
                                >
                                    {/* Thumbnail for images, icon for PDFs */}
                                    {img ? (
                                        <ImageWithLoader
                                            src={url}
                                            alt={name}
                                            containerClassName="h-10 w-10 rounded shrink-0 border border-border"
                                            className="h-10 w-10 object-cover"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0 border border-border">
                                            <FileIcon name={name} className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {isPdf(name) ? 'Documento PDF' : 'Imagen'}
                                        </p>
                                    </div>

                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0"
                                    >
                                        <Button variant="outline" size="sm" className="gap-1.5 h-8">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Abrir
                                        </Button>
                                    </a>
                                </div>
                            )
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
