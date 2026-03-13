'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Loader2, Upload, X } from 'lucide-react'
import { Manual } from '@/types/manual'
import { manualSchema, ManualForm as ManualFormType } from '@/lib/validations/schema'
import { uploadManualFile, deleteManualPdf } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form'
import { FormActionButtons } from '@/components/common/form-action-buttons'

interface ManualFormProps {
    initialData?: Manual | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (data: any) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

export interface ManualFormHandle {
    triggerCancel: () => void
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']

/** Strips the Firebase timestamp prefix: `1773179814010_` → `` */
function cleanFileName(name: string): string {
    return name.replace(/^\d+_/, '')
}

function isImageName(name: string): boolean {
    return /\.(jpe?g|png|gif|webp)$/i.test(name)
}

interface FileEntry {
    id: string
    /** Clean display name (no timestamp prefix) */
    name: string
    type: 'existing' | 'pending'
    url?: string          // Firebase URL (existing entries)
    file?: File           // original File object (new pending entries — not uploaded yet)
    uploadedUrl?: string  // Firebase URL set after upload completes (only set at submit time)
    /** Blob URL (new images) or Firebase URL (existing images) — for thumbnail preview */
    previewUrl?: string
    isImage: boolean
    error?: string
}

export const ManualForm = forwardRef<ManualFormHandle, ManualFormProps>(
    function ManualForm({ initialData, onSubmit, onCancel, isLoading = false }, ref) {
        const fileInputRef = useRef<HTMLInputElement>(null)
        const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
        const [uploadError, setUploadError] = useState('')
        const [isSubmitting, setIsSubmitting] = useState(false)
        const [toDeleteOnSave, setToDeleteOnSave] = useState<string[]>([])

        // Keep a ref so the cleanup effect (on unmount) sees the latest entries
        const fileEntriesRef = useRef<FileEntry[]>([])
        fileEntriesRef.current = fileEntries

        const form = useForm<ManualFormType>({
            resolver: zodResolver(manualSchema),
            defaultValues: { nombre: '', descripcion: '' }
        })

        // Revoke all blob URLs when the form unmounts to avoid memory leaks
        useEffect(() => {
            return () => {
                fileEntriesRef.current.forEach(e => {
                    if (e.previewUrl?.startsWith('blob:')) {
                        URL.revokeObjectURL(e.previewUrl)
                    }
                })
            }
        }, [])

        useEffect(() => {
            if (initialData) {
                form.reset({
                    nombre: initialData.name,
                    descripcion: initialData.description || '',
                })
                const existing: FileEntry[] = (initialData.fileUrls ?? []).map((url, i) => {
                    const raw = (() => {
                        try {
                            const match = url.match(/\/o\/(.+?)\?/)
                            if (match) return decodeURIComponent(match[1]).split('/').pop() || `Archivo ${i + 1}`
                        } catch { /* ignore */ }
                        return `Archivo ${i + 1}`
                    })()
                    const img = isImageName(raw)
                    return {
                        id: `existing-${i}`,
                        name: cleanFileName(raw),
                        type: 'existing',
                        url,
                        previewUrl: img ? url : undefined,
                        isImage: img,
                    }
                })
                setFileEntries(existing)
            } else {
                form.reset({ nombre: '', descripcion: '' })
                setFileEntries([])
            }
            setToDeleteOnSave([])
            setUploadError('')
        }, [initialData, form])

        // ── File selection — no upload, just store the File locally ──────────────
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || [])
            if (!files.length) return

            const invalid = files.filter(f => !ALLOWED_TYPES.includes(f.type))
            if (invalid.length > 0) {
                setUploadError('Solo se permiten archivos PDF, JPG, PNG, GIF o WebP')
                e.target.value = ''
                return
            }
            setUploadError('')

            // Build entries with blob previews for images — no upload yet
            const newEntries: FileEntry[] = files.map(file => {
                const img = file.type.startsWith('image/')
                return {
                    id: `pending-${Date.now()}-${Math.random()}`,
                    name: file.name,
                    type: 'pending',
                    file,
                    previewUrl: img ? URL.createObjectURL(file) : undefined,
                    isImage: img,
                }
            })

            setFileEntries(prev => [...prev, ...newEntries])
            e.target.value = ''
        }

        const handleRemoveEntry = (id: string) => {
            const entry = fileEntries.find(e => e.id === id)
            if (!entry) return

            // Schedule Firebase deletion for existing entries (deferred until successful save)
            if (entry.type === 'existing' && entry.url) {
                setToDeleteOnSave(prev => [...prev, entry.url!])
            }

            // Revoke blob URL if it was created for a new image preview
            if (entry.previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(entry.previewUrl)
            }

            setFileEntries(prev => prev.filter(e => e.id !== id))
        }

        // ── Submit — upload pending files to Firebase, then call onSubmit ────────
        const handleFormSubmit = async (values: ManualFormType) => {
            const pendingEntries = fileEntries.filter(e => e.type === 'pending' && e.file)
            const existingUrls = fileEntries
                .filter(e => e.type === 'existing' && e.url)
                .map(e => e.url!)

            if (pendingEntries.length === 0 && existingUrls.length === 0) {
                setUploadError('Debe agregar al menos un archivo')
                return
            }

            setIsSubmitting(true)
            setUploadError('')

            try {
                // Upload all pending files now
                const uploadedUrls = await Promise.all(
                    pendingEntries.map(entry => uploadManualFile(entry.file!))
                )

                const allUrls = [...existingUrls, ...uploadedUrls]

                const manualData = {
                    name: values.nombre,
                    description: values.descripcion || undefined,
                    fileUrls: allUrls,
                }

                await onSubmit(manualData)

                // ✅ Save succeeded → delete removed existing files from Firebase
                if (toDeleteOnSave.length > 0) {
                    Promise.allSettled(
                        toDeleteOnSave.map(url =>
                            deleteManualPdf(url).catch(err =>
                                console.error('Error eliminando archivo de Firebase:', err)
                            )
                        )
                    )
                    setToDeleteOnSave([])
                }
            } catch (err) {
                console.error('Error al guardar el manual:', err)
                setUploadError('Ocurrió un error al subir los archivos. Intentá de nuevo.')
            } finally {
                setIsSubmitting(false)
            }
        }

        const handleCancel = () => {
            // Revoke all remaining blob URLs (pending files were never uploaded, nothing to delete from Firebase)
            fileEntries.forEach(e => {
                if (e.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(e.previewUrl)
            })

            setFileEntries([])
            setToDeleteOnSave([])
            setUploadError('')
            onCancel()
        }

        useImperativeHandle(ref, () => ({
            triggerCancel: handleCancel,
        }))

        const isBusy = isLoading || isSubmitting

        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                    <div className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Manual <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Manual de Usuario v2.0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descripción breve del manual..."
                                            className="min-h-[80px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* ─── Multi-file upload ─── */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Archivos <span className="text-red-500">*</span>
                                <span className="text-muted-foreground font-normal ml-1 text-xs">(PDF, JPG, PNG, GIF, WebP)</span>
                            </label>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf,image/*"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {/* File cards */}
                            {fileEntries.length > 0 && (
                                <div className="space-y-2">
                                    {fileEntries.map(entry => (
                                        <div
                                            key={entry.id}
                                            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${entry.error
                                                ? 'border-destructive bg-destructive/5'
                                                : 'border-border bg-muted/20'
                                                }`}
                                        >
                                            {/* Preview thumbnail / icon */}
                                            <div className="h-11 w-11 shrink-0 rounded-md overflow-hidden border border-border bg-muted flex items-center justify-center">
                                                {entry.isImage && entry.previewUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={entry.previewUrl}
                                                        alt={entry.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>

                                            {/* Name + status */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{entry.name}</p>
                                                {entry.error && (
                                                    <p className="text-xs text-destructive">{entry.error}</p>
                                                )}
                                                {!entry.error && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {entry.type === 'existing'
                                                            ? (entry.isImage ? 'Imagen' : 'Documento PDF')
                                                            : <span className="text-amber-500">Pendiente de subir</span>
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Remove button */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                                onClick={() => handleRemoveEntry(entry.id)}
                                                disabled={isBusy}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add files button */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full gap-2 border-dashed"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isBusy}
                            >
                                <Upload className="h-4 w-4" />
                                Agregar archivos
                            </Button>

                            {uploadError && (
                                <p className="text-sm font-medium text-destructive">{uploadError}</p>
                            )}
                        </div>
                    </div>

                    <FormActionButtons
                        onCancel={handleCancel}
                        isLoading={isBusy}
                        submitText={
                            isSubmitting
                                ? 'Subiendo archivos...'
                                : initialData
                                    ? 'Actualizar Manual'
                                    : 'Crear Manual'
                        }
                    />
                </form>
            </Form>
        )
    }
)
