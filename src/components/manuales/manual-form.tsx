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
    file?: File           // original File object (new pending entries)
    uploading: boolean
    uploadedUrl?: string  // Firebase URL set after upload completes
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
                        uploading: false,
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

        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || [])
            if (!files.length) return

            const invalid = files.filter(f => !ALLOWED_TYPES.includes(f.type))
            if (invalid.length > 0) {
                setUploadError('Solo se permiten archivos PDF, JPG, PNG, GIF o WebP')
                e.target.value = ''
                return
            }
            setUploadError('')

            // Build entries with blob previews for images
            const newEntries: FileEntry[] = files.map(file => {
                const img = file.type.startsWith('image/')
                return {
                    id: `pending-${Date.now()}-${Math.random()}`,
                    name: file.name,           // new files already have clean names
                    type: 'pending',
                    file,
                    uploading: true,
                    previewUrl: img ? URL.createObjectURL(file) : undefined,
                    isImage: img,
                }
            })

            setFileEntries(prev => [...prev, ...newEntries])

            await Promise.all(
                newEntries.map(async (entry) => {
                    try {
                        const url = await uploadManualFile(entry.file!)
                        setFileEntries(prev =>
                            prev.map(e =>
                                e.id === entry.id
                                    ? { ...e, uploading: false, uploadedUrl: url }
                                    : e
                            )
                        )
                    } catch {
                        setFileEntries(prev =>
                            prev.map(e =>
                                e.id === entry.id
                                    ? { ...e, uploading: false, error: 'Error al subir' }
                                    : e
                            )
                        )
                    }
                })
            )

            e.target.value = ''
        }

        const handleRemoveEntry = (id: string) => {
            const entry = fileEntries.find(e => e.id === id)
            if (!entry) return

            // Schedule Firebase deletion (deferred until successful save)
            const urlToSchedule = entry.type === 'existing' ? entry.url : entry.uploadedUrl
            if (urlToSchedule) {
                setToDeleteOnSave(prev => [...prev, urlToSchedule])
            }

            // Revoke blob URL if it was created for a new image
            if (entry.previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(entry.previewUrl)
            }

            setFileEntries(prev => prev.filter(e => e.id !== id))
        }

        const isAnyUploading = fileEntries.some(e => e.uploading)

        const handleFormSubmit = async (values: ManualFormType) => {
            const urls: string[] = fileEntries
                .filter(e => !e.error)
                .map(e => (e.type === 'existing' ? e.url! : e.uploadedUrl ?? ''))
                .filter(Boolean)

            if (urls.length === 0) {
                setUploadError('Debe agregar al menos un archivo')
                return
            }
            if (isAnyUploading) {
                setUploadError('Espere a que terminen de subirse todos los archivos')
                return
            }

            const manualData = {
                name: values.nombre,
                description: values.descripcion || undefined,
                fileUrls: urls,
            }

            try {
                await onSubmit(manualData)
                // ✅ Save succeeded → now delete removed files from Firebase
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
            } catch {
                // ❌ Save failed → keep toDeleteOnSave intact, don't touch Firebase
            }
        }

        const handleCancel = () => {
            // Delete newly uploaded files that were never saved to the DB
            const orphans = fileEntries
                .filter(e => e.type === 'pending' && e.uploadedUrl)
                .map(e => e.uploadedUrl!)

            if (orphans.length > 0) {
                Promise.allSettled(
                    orphans.map(url =>
                        deleteManualPdf(url).catch(err =>
                            console.error('Error eliminando archivo huérfano:', err)
                        )
                    )
                )
            }

            // Revoke all remaining blob URLs
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
                                                {entry.uploading && (
                                                    <p className="text-xs text-muted-foreground">Subiendo...</p>
                                                )}
                                                {entry.error && (
                                                    <p className="text-xs text-destructive">{entry.error}</p>
                                                )}
                                                {!entry.uploading && !entry.error && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {entry.isImage ? 'Imagen' : 'Documento PDF'}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Spinner or remove */}
                                            {entry.uploading ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                                    onClick={() => handleRemoveEntry(entry.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
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
                                disabled={isAnyUploading}
                            >
                                {isAnyUploading
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Upload className="h-4 w-4" />
                                }
                                {isAnyUploading ? 'Subiendo archivos...' : 'Agregar archivos'}
                            </Button>

                            {uploadError && (
                                <p className="text-sm font-medium text-destructive">{uploadError}</p>
                            )}
                        </div>
                    </div>

                    <FormActionButtons
                        onCancel={handleCancel}
                        isLoading={isLoading || isAnyUploading}
                        submitText={initialData ? 'Actualizar Manual' : 'Crear Manual'}
                    />
                </form>
            </Form>
        )
    }
)
