'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { ImportacionForm } from '../../../../../components/importaciones/importacion-form'
import { showSnackbar } from '@/components/ui/snackbar'

import { useImportacionesStore } from '@/stores/importaciones/importacionesStore'
import { Importacion, CreateImportacionForm } from '@/types/importacion'

interface EditImportacionClientProps {
  importacion: Importacion
}

export function EditImportacionClient({ importacion }: EditImportacionClientProps) {
  const router = useRouter()
  const { updateImportacion } = useImportacionesStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateImportacionForm) => {
    setIsLoading(true)
    try {
      await updateImportacion(importacion.id.toString(), data)
      showSnackbar('Importación actualizada correctamente', 'success')
      router.push(`/dashboard/importaciones/${importacion.id}`)
    } catch (error: unknown) {
      console.error('Error updating importacion:', error)
      showSnackbar('Error al actualizar la importación', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <FadeIn direction="none">
        <PageHeader
          title={`Editar Importación ${importacion.folder}`}
          subtitle="Modificá los datos y costos de esta importación"
          backButton
        />
      </FadeIn>

      <FadeIn delay={100}>
        <ImportacionForm
          defaultValues={importacion}
          defaultProveedor={importacion.provider}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </FadeIn>
    </div>
  )
}
