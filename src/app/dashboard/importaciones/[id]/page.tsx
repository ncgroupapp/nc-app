import { notFound } from 'next/navigation'
import { importacionesService } from '@/services/importaciones.service'
import { ImportacionDetailClient } from './ImportacionDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ImportacionDetailPage({ params }: PageProps) {
  const { id } = await params

  let importacion
  try {
    importacion = await importacionesService.getById(id)
  } catch {
    notFound()
  }

  return <ImportacionDetailClient importacion={importacion} />
}
