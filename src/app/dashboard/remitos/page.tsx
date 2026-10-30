'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  FileText,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Printer,
  Tag,
  Trash2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { showSnackbar } from '@/components/ui/snackbar'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { SearchInput } from '@/components/common/search-input'
import { GuideFormDialog } from '@/components/remitos/guide-form-dialog'
import { PdfPreviewDialog, PdfRequest } from '@/components/remitos/pdf-preview-dialog'
import { RemitoFormDialog } from '@/components/remitos/remito-form-dialog'

import { useConfirm } from '@/hooks/use-confirm'
import { useDebounce } from '@/hooks/use-debounce'
import { handleActionError } from '@/lib/error-handler'
import {
  REMITO_STATUS_CLASSES,
  REMITO_STATUS_LABELS,
  Remito,
  RemitoStatus,
  ShippingGuide,
  formatIsoDate,
  formatRemitoNumber,
  remitosService,
} from '@/services/remitos.service'

const formatQuantity = (value: number) =>
  Number(value).toLocaleString('es-UY', { maximumFractionDigits: 2 })

export default function RemitosPage() {
  const { confirm } = useConfirm()

  // ===== Remitos =====
  const [remitos, setRemitos] = useState<Remito[]>([])
  const [loadingRemitos, setLoadingRemitos] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<RemitoStatus | 'all'>('all')
  const debouncedSearch = useDebounce(search, 300)
  const [remitoDialog, setRemitoDialog] = useState<{ open: boolean; remito: Remito | null }>({ open: false, remito: null })

  // ===== Guías =====
  const [guides, setGuides] = useState<ShippingGuide[]>([])
  const [loadingGuides, setLoadingGuides] = useState(true)
  const [guideSearch, setGuideSearch] = useState('')
  const debouncedGuideSearch = useDebounce(guideSearch, 300)
  const [selected, setSelected] = useState<number[]>([])
  const [guideDialog, setGuideDialog] = useState<{ open: boolean; guide: ShippingGuide | null; fromRemito: Remito | null }>({
    open: false,
    guide: null,
    fromRemito: null,
  })
  const [tab, setTab] = useState('remitos')
  const [pdf, setPdf] = useState<PdfRequest | null>(null)

  const loadRemitos = useCallback(async () => {
    setLoadingRemitos(true)
    try {
      setRemitos(await remitosService.getAll({
        search: debouncedSearch || undefined,
        status: status === 'all' ? undefined : status,
      }))
    } catch (error) {
      handleActionError(error, 'Error al cargar los remitos')
    } finally {
      setLoadingRemitos(false)
    }
  }, [debouncedSearch, status])

  const loadGuides = useCallback(async () => {
    setLoadingGuides(true)
    try {
      setGuides(await remitosService.getGuides(debouncedGuideSearch || undefined))
    } catch (error) {
      handleActionError(error, 'Error al cargar las guías de envío')
    } finally {
      setLoadingGuides(false)
    }
  }, [debouncedGuideSearch])

  useEffect(() => { loadRemitos() }, [loadRemitos])
  useEffect(() => { loadGuides() }, [loadGuides])

  const showRemitoPdf = (remito: Remito) =>
    setPdf({
      title: `Remito N.º ${formatRemitoNumber(remito.number)} · ${remito.receiverName}`,
      fileName: `remito-${formatRemitoNumber(remito.number)}.pdf`,
      load: () => remitosService.getPdf(remito.id),
    })

  const showGuidesPdf = (ids: number[]) =>
    setPdf({
      title: ids.length === 1 ? 'Guía de envío' : `Guías de envío (${ids.length})`,
      fileName: 'guias-envio.pdf',
      load: () => remitosService.getGuidesPdf(ids),
    })

  const changeStatus = async (remito: Remito, next: RemitoStatus) => {
    if (next === 'anulado') {
      const ok = await confirm({
        title: `Anular remito N.º ${formatRemitoNumber(remito.number)}`,
        message: 'El remito queda guardado con la marca ANULADO y su número no se vuelve a usar.',
        variant: 'destructive',
        confirmText: 'Anular',
      })
      if (!ok) return
    }
    try {
      await remitosService.update(remito.id, { status: next })
      showSnackbar(next === 'entregado' ? 'Remito marcado como entregado' : next === 'anulado' ? 'Remito anulado' : 'Remito actualizado', 'success')
      loadRemitos()
    } catch (error) {
      handleActionError(error, 'No se pudo actualizar el remito')
    }
  }

  const deleteGuide = async (guide: ShippingGuide) => {
    const ok = await confirm({
      title: 'Eliminar guía de envío',
      message: `¿Eliminar la guía de ${guide.recipientName}?`,
      variant: 'destructive',
      confirmText: 'Eliminar',
    })
    if (!ok) return
    try {
      await remitosService.deleteGuide(guide.id)
      setSelected((prev) => prev.filter((id) => id !== guide.id))
      showSnackbar('Guía eliminada', 'success')
      loadGuides()
    } catch (error) {
      handleActionError(error, 'No se pudo eliminar la guía')
    }
  }

  const toggleSelected = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <FadeIn>
      <PageHeader
        title="Remitos"
        subtitle="Remitos de entrega y guías de envío para paquetes"
        icon={Package}
        backButton={false}
        actions={
          tab === 'remitos' ? (
            <Button onClick={() => setRemitoDialog({ open: true, remito: null })}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo remito
            </Button>
          ) : (
            <Button onClick={() => setGuideDialog({ open: true, guide: null, fromRemito: null })}>
              <Plus className="mr-2 h-4 w-4" /> Nueva guía
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="remitos"><FileText className="mr-2 h-4 w-4" />Remitos</TabsTrigger>
          <TabsTrigger value="guias"><Tag className="mr-2 h-4 w-4" />Guías de envío</TabsTrigger>
        </TabsList>

        <TabsContent value="remitos">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-3 md:flex-row">
                <SearchInput
                  placeholder="Buscar por número, cliente u orden de compra..."
                  value={search}
                  onChange={setSearch}
                  className="md:max-w-md"
                />
                <Select value={status} onValueChange={(v) => setStatus(v as RemitoStatus | 'all')}>
                  <SelectTrigger className="md:w-48" aria-label="Filtrar por estado"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {(Object.keys(REMITO_STATUS_LABELS) as RemitoStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{REMITO_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N.º</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Orden de compra</TableHead>
                      <TableHead className="text-right">Ítems</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[110px] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingRemitos ? (
                      <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Cargando...</TableCell></TableRow>
                    ) : remitos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                          {search || status !== 'all' ? 'No hay remitos con esos filtros.' : 'Todavía no hay remitos. Creá el primero con "Nuevo remito".'}
                        </TableCell>
                      </TableRow>
                    ) : remitos.map((remito) => {
                      const units = remito.items.reduce((sum, item) => sum + Number(item.quantity), 0)
                      return (
                        <TableRow key={remito.id} className={remito.status === 'anulado' ? 'opacity-60' : undefined}>
                          <TableCell className="font-mono font-semibold">{formatRemitoNumber(remito.number)}</TableCell>
                          <TableCell>{formatIsoDate(remito.date)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{remito.receiverName}</div>
                            {remito.receiverRut && <div className="text-xs text-muted-foreground">RUT {remito.receiverRut}</div>}
                          </TableCell>
                          <TableCell>{remito.purchaseOrder || '-'}</TableCell>
                          <TableCell className="text-right">
                            {remito.items.length}
                            <span className="block text-xs text-muted-foreground">{formatQuantity(units)} unid.</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={REMITO_STATUS_CLASSES[remito.status]}>
                              {REMITO_STATUS_LABELS[remito.status]}
                            </Badge>
                            {remito.status === 'entregado' && remito.deliveredAt && (
                              <span className="block text-xs text-muted-foreground mt-1">{formatIsoDate(remito.deliveredAt)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`PDF del remito ${formatRemitoNumber(remito.number)}`}
                                title="Ver PDF"
                                onClick={() => showRemitoPdf(remito)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="Más acciones">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    disabled={remito.status === 'anulado'}
                                    onClick={() => setRemitoDialog({ open: true, remito })}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setTab('guias')
                                      setGuideDialog({ open: true, guide: null, fromRemito: remito })
                                    }}
                                  >
                                    <Tag className="mr-2 h-4 w-4" /> Crear guía de envío
                                  </DropdownMenuItem>
                                  {remito.status === 'emitido' && (
                                    <DropdownMenuItem onClick={() => changeStatus(remito, 'entregado')}>
                                      <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar entregado
                                    </DropdownMenuItem>
                                  )}
                                  {remito.status === 'entregado' && (
                                    <DropdownMenuItem onClick={() => changeStatus(remito, 'emitido')}>
                                      <FileText className="mr-2 h-4 w-4" /> Volver a emitido
                                    </DropdownMenuItem>
                                  )}
                                  {remito.status !== 'anulado' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-red-600" onClick={() => changeStatus(remito, 'anulado')}>
                                        <Ban className="mr-2 h-4 w-4" /> Anular
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guias">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <SearchInput
                  placeholder="Buscar por destinatario..."
                  value={guideSearch}
                  onChange={setGuideSearch}
                  className="md:max-w-md"
                />
                <Button
                  variant="secondary"
                  disabled={selected.length === 0}
                  onClick={() => showGuidesPdf(selected)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir seleccionadas{selected.length > 0 ? ` (${selected.length})` : ''}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Se imprimen dos guías por hoja A4 horizontal, en el orden en que las marcás.
              </p>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          aria-label="Seleccionar todas"
                          checked={guides.length > 0 && selected.length === guides.length}
                          onCheckedChange={(checked) => setSelected(checked ? guides.map((g) => g.id) : [])}
                        />
                      </TableHead>
                      <TableHead>Destinatario</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Creada</TableHead>
                      <TableHead className="w-[130px] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingGuides ? (
                      <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Cargando...</TableCell></TableRow>
                    ) : guides.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          {guideSearch ? 'No hay guías con esa búsqueda.' : 'Todavía no hay guías. Creá una con "Nueva guía".'}
                        </TableCell>
                      </TableRow>
                    ) : guides.map((guide) => (
                      <TableRow key={guide.id}>
                        <TableCell>
                          <Checkbox
                            aria-label={`Seleccionar guía de ${guide.recipientName}`}
                            checked={selected.includes(guide.id)}
                            onCheckedChange={() => toggleSelected(guide.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{guide.recipientName}</TableCell>
                        <TableCell>{guide.recipientPhone || '-'}</TableCell>
                        <TableCell className="max-w-[280px]">
                          <span className="line-clamp-2 text-sm">{guide.addressLines.join(' · ') || '-'}</span>
                        </TableCell>
                        <TableCell>{new Date(guide.createdAt).toLocaleDateString('es-UY')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Imprimir esta guía"
                              aria-label={`Imprimir guía de ${guide.recipientName}`}
                              onClick={() => showGuidesPdf([guide.id])}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              aria-label={`Editar guía de ${guide.recipientName}`}
                              onClick={() => setGuideDialog({ open: true, guide, fromRemito: null })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              title="Eliminar"
                              aria-label={`Eliminar guía de ${guide.recipientName}`}
                              onClick={() => deleteGuide(guide)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RemitoFormDialog
        open={remitoDialog.open}
        remito={remitoDialog.remito}
        onOpenChange={(open) => setRemitoDialog((prev) => ({ ...prev, open }))}
        onSaved={() => loadRemitos()}
      />
      <PdfPreviewDialog request={pdf} onClose={() => setPdf(null)} />
      <GuideFormDialog
        open={guideDialog.open}
        guide={guideDialog.guide}
        fromRemito={guideDialog.fromRemito}
        onOpenChange={(open) => setGuideDialog((prev) => ({ ...prev, open }))}
        onSaved={() => loadGuides()}
      />
    </FadeIn>
  )
}
