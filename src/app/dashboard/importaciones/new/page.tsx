'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { ImportacionForm } from '@/components/importaciones/importacion-form'
import { showSnackbar } from '@/components/ui/snackbar'

import { useImportacionesStore } from '@/stores/importaciones/importacionesStore'
import { CreateImportacionForm } from '@/types/importacion'

export default function NuevaImportacionPage() {
  const router = useRouter()
  const { createImportacion } = useImportacionesStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateImportacionForm) => {
    setIsLoading(true)
    try {
      await createImportacion(data)
      showSnackbar('Importación creada correctamente', 'success')
      router.push('/dashboard/importaciones')
    } catch (error: unknown) {
      console.error('Error creating importacion:', error)
      showSnackbar('Error al crear la importación', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <FadeIn direction="none">
        <PageHeader
          title="Nueva Importación"
          subtitle="Registrá una nueva importación con todos sus costos asociados"
          backButton
        />
      </FadeIn>

      <FadeIn delay={100}>
        <ImportacionForm onSubmit={handleSubmit} isLoading={isLoading} />
      </FadeIn>
    </div>
  )
}
