'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Loader2, Upload, X } from 'lucide-react'
import { Manual } from '@/types/manual'
import { manualSchema, ManualForm as ManualFormType } from '@/lib/validations/schema'
import { uploadManualPdf } from '@/lib/firebase'
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

export function ManualForm({ initialData, onSubmit, onCancel, isLoading = false }: ManualFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [fileUrl, setFileUrl] = useState<string>('')
    const [uploadError, setUploadError] = useState<string>('')
    const [clearedExisting, setClearedExisting] = useState(false)

    const form = useForm<ManualFormType>({
        resolver: zodResolver(manualSchema),
        defaultValues: {
            nombre: '',
            descripcion: '',
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                nombre: initialData.name,
                descripcion: initialData.description || '',
            })
            setFileUrl(initialData.fileUrl)
            setClearedExisting(false)
        }
    }, [initialData, form])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            setUploadError('Solo se permiten archivos PDF')
            return
        }

        setUploadError('')
        setSelectedFile(file)
        setIsUploading(true)
        try {
            const url = await uploadManualPdf(file)
            setFileUrl(url)
        } catch {
            setUploadError('Error al subir el archivo. Intentá de nuevo.')
            setSelectedFile(null)
        } finally {
            setIsUploading(false)
        }
    }

    const handleClearFile = () => {
        setSelectedFile(null)
        setFileUrl('')
        setClearedExisting(true)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleFormSubmit = async (values: ManualFormType) => {
        if (!fileUrl) {
            setUploadError('El archivo PDF es obligatorio')
            return
        }

        const manualData = {
            name: values.nombre,
            description: values.descripcion || undefined,
            fileUrl,
        }

        await onSubmit(manualData)
    }

    const currentFileName = selectedFile?.name ?? (!clearedExisting && initialData?.fileUrl ? 'Archivo actual' : null)

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

                    {/* PDF Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Archivo PDF <span className="text-red-500">*</span>
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {currentFileName ? (
                            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
                                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                <span className="flex-1 truncate text-sm">{currentFileName}</span>
                                {isUploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                {!isUploading && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        onClick={handleClearFile}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full gap-2 border-dashed"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                                {isUploading ? 'Subiendo archivo...' : 'Seleccionar PDF'}
                            </Button>
                        )}

                        {uploadError && (
                            <p className="text-sm font-medium text-destructive">{uploadError}</p>
                        )}
                    </div>
                </div>

                <FormActionButtons
                    onCancel={onCancel}
                    isLoading={isLoading || isUploading}
                    submitText={initialData ? 'Actualizar Manual' : 'Crear Manual'}
                />
            </form>
        </Form>
    )
}
