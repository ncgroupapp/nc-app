import { notFound } from 'next/navigation'
import { importacionesService } from '@/services/importaciones.service'
import { EditImportacionClient } from './EditImportacionClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditImportacionPage({ params }: PageProps) {
  const { id } = await params

  let importacion
  try {
    importacion = await importacionesService.getById(id)
  } catch {
    notFound()
  }

  return <EditImportacionClient importacion={importacion} />
}
