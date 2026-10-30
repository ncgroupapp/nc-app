'use client'

import { useCallback, useEffect, useState } from 'react'
import { BadgeCheck, Eye, FileX, MoreHorizontal, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { showSnackbar } from '@/components/ui/snackbar'

import { CertificateDialog } from '@/components/certificados/certificate-dialog'
import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { PdfPreviewDialog, PdfRequest } from '@/components/remitos/pdf-preview-dialog'

import { useConfirm } from '@/hooks/use-confirm'
import { handleActionError } from '@/lib/error-handler'
import { cn } from '@/lib/utils'
import { formatIsoDate } from '@/services/remitos.service'
import {
  CERTIFICATE_STATUS_CLASSES,
  CERTIFICATE_STATUS_LABELS,
  Certificate,
  CertificateStatus,
  certificatesService,
  describeExpiry,
} from '@/services/certificates.service'

const SUMMARY: { status: CertificateStatus; className: string }[] = [
  { status: 'vencido', className: 'text-red-700' },
  { status: 'por_vencer', className: 'text-amber-700' },
  { status: 'sin_cargar', className: 'text-slate-700' },
  { status: 'vigente', className: 'text-emerald-700' },
]

export default function CertificadosPage() {
  const { confirm } = useConfirm()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<{ open: boolean; certificate: Certificate | null }>({ open: false, certificate: null })
  const [preview, setPreview] = useState<PdfRequest | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCertificates(await certificatesService.getAll())
    } catch (error) {
      handleActionError(error, 'Error al cargar los certificados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const rupe = certificates.filter((c) => c.requiredForRupe)
  const rupeOk = rupe.length > 0 && rupe.every((c) => c.status === 'vigente' || c.status === 'por_vencer')

  const showFile = (certificate: Certificate) =>
    setPreview({
      title: certificate.name,
      fileName: certificate.fileName ?? `${certificate.name}.pdf`,
      load: () => certificatesService.getFile(certificate),
    })

  const removeFile = async (certificate: Certificate) => {
    const ok = await confirm({
      title: 'Quitar archivo',
      message: `¿Quitar el archivo de ${certificate.name}? Las fechas quedan como están.`,
      variant: 'destructive',
      confirmText: 'Quitar',
    })
    if (!ok) return
    try {
      await certificatesService.removeFile(certificate.id)
      showSnackbar('Archivo quitado', 'success')
      load()
    } catch (error) {
      handleActionError(error, 'No se pudo quitar el archivo')
    }
  }

  const remove = async (certificate: Certificate) => {
    const ok = await confirm({
      title: 'Eliminar certificado',
      message: `¿Eliminar ${certificate.name}?`,
      variant: 'destructive',
      confirmText: 'Eliminar',
    })
    if (!ok) return
    try {
      await certificatesService.delete(certificate.id)
      showSnackbar('Certificado eliminado', 'success')
      load()
    } catch (error) {
      handleActionError(error, 'No se pudo eliminar el certificado')
    }
  }

  return (
    <FadeIn>
      <PageHeader
        title="Certificados"
        subtitle="Los certificados que pide RUPE y las licitaciones, con aviso antes de que venzan"
        icon={BadgeCheck}
        backButton={false}
        actions={
          <Button onClick={() => setDialog({ open: true, certificate: null })}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo certificado
          </Button>
        }
      />

      {!loading && certificates.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className={cn('py-4 lg:col-span-1', rupeOk ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">RUPE</p>
              <p className={cn('text-lg font-semibold', rupeOk ? 'text-emerald-800' : 'text-red-700')}>
                {rupeOk ? 'Todo al día' : 'Hay que renovar'}
              </p>
            </CardContent>
          </Card>
          {SUMMARY.map(({ status, className }) => (
            <Card key={status} className="py-4">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">{CERTIFICATE_STATUS_LABELS[status]}</p>
                <p className={cn('text-2xl font-bold tabular-nums', className)}>
                  {certificates.filter((c) => c.status === status).length}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificado</TableHead>
                  <TableHead>Emisión</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[150px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Cargando...</TableCell></TableRow>
                ) : certificates.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No hay certificados.</TableCell></TableRow>
                ) : certificates.map((certificate) => (
                  <TableRow key={certificate.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        {certificate.name}
                        {certificate.requiredForRupe && (
                          <Badge variant="outline" className="border-brand-blue/30 text-[10px] text-brand-navy">RUPE</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[certificate.issuer, certificate.notes].filter(Boolean).join(' · ') || certificate.description}
                      </div>
                    </TableCell>
                    <TableCell>{formatIsoDate(certificate.issueDate)}</TableCell>
                    <TableCell>{formatIsoDate(certificate.expiryDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={CERTIFICATE_STATUS_CLASSES[certificate.status]}>
                        {CERTIFICATE_STATUS_LABELS[certificate.status]}
                      </Badge>
                      <span className="mt-1 block text-xs text-muted-foreground">{describeExpiry(certificate)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={certificate.fileName ? 'Ver archivo' : 'Sin archivo'}
                          aria-label={`Ver archivo de ${certificate.name}`}
                          disabled={!certificate.fileName}
                          onClick={() => showFile(certificate)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Renovar / cargar fechas"
                          aria-label={`Renovar ${certificate.name}`}
                          onClick={() => setDialog({ open: true, certificate })}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Más acciones">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDialog({ open: true, certificate })}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            {certificate.fileName && (
                              <DropdownMenuItem onClick={() => removeFile(certificate)}>
                                <FileX className="mr-2 h-4 w-4" /> Quitar archivo
                              </DropdownMenuItem>
                            )}
                            {!certificate.code && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => remove(certificate)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CertificateDialog
        open={dialog.open}
        certificate={dialog.certificate}
        onClose={() => setDialog({ open: false, certificate: null })}
        onSaved={load}
      />
      <PdfPreviewDialog request={preview} onClose={() => setPreview(null)} />
    </FadeIn>
  )
}
