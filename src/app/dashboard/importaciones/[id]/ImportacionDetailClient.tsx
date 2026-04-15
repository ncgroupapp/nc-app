'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Box,
  Building2,
  Calendar,
  Edit,
  FileText,
  Hash,
  Package,
  Scale,
  Ship,
  Truck,
  DollarSign,
  Link2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { showSnackbar } from '@/components/ui/snackbar'

import { FadeIn } from '@/components/common/fade-in'
import { PageHeader } from '@/components/common/page-header'
import { DetailCard, DetailItem } from '@/components/common/detail-card'

import { formatCalendarDate } from '@/lib/utils'
import { importacionesService } from '@/services/importaciones.service'
import { Importacion } from '@/types/importacion'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ESTADO_COLORS: Record<
  Importacion['status'],
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  'En Tránsito': 'default',
  'En Aduana': 'secondary',
  'Liberada': 'outline',
  'Entregada': 'secondary',
}

const NEXT_ESTADO: Partial<Record<Importacion['status'], Importacion['status']>> = {
  'En Tránsito': 'En Aduana',
  'En Aduana': 'Liberada',
  'Liberada': 'Entregada',
}

const fmt = (val?: number | null): string => {
  if (val == null || val === 0) return '—'
  return val.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatImportDate = (value?: string): string => formatCalendarDate(value)

interface CostRowProps {
  label: string
  value?: number | null
}

function CostRow({ label, value }: CostRowProps) {
  if (value == null || value === 0) return null
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{fmt(value)}</span>
    </div>
  )
}

function SubtotalRow({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-2 mt-1 bg-muted/40 rounded px-2">
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-sm font-bold tabular-nums">{fmt(value)}</span>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

interface ImportacionDetailClientProps {
  importacion: Importacion
}

export function ImportacionDetailClient({
  importacion: initialData,
}: ImportacionDetailClientProps) {
  const router = useRouter()
  const [importacion, setImportacion] = useState<Importacion>(initialData)
  const [isChangingEstado, setIsChangingEstado] = useState(false)

  const nextEstado = NEXT_ESTADO[importacion.status]

  const handleChangeEstado = async () => {
    if (!nextEstado) return
    setIsChangingEstado(true)
    try {
      const updated = await importacionesService.changeEstado(importacion.id.toString(), nextEstado)
      setImportacion((prev) => ({ ...prev, status: updated.status }))
      showSnackbar(
        `Estado actualizado a "${nextEstado}" correctamente`,
        'success',
      )
    } catch {
      showSnackbar('Error al cambiar el estado', 'error')
    } finally {
      setIsChangingEstado(false)
    }
  }

  const costos = importacion

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <FadeIn direction="none">
        <PageHeader
          title={`Importación ${importacion.folder}`}
          subtitle={
            <Badge variant={ESTADO_COLORS[importacion.status]}>
              {importacion.status}
            </Badge>
          }
          backButton
          actions={
            <div className="flex gap-2">
              {nextEstado && (
                <Button
                  variant="outline"
                  onClick={handleChangeEstado}
                  disabled={isChangingEstado}
                  className="gap-2"
                >
                  <ArrowRight className="size-4" />
                  {isChangingEstado ? 'Actualizando...' : `Avanzar a "${nextEstado}"`}
                </Button>
              )}
              <Button
                onClick={() =>
                  router.push(`/dashboard/importaciones/${importacion.id}/edit`)
                }
                className="gap-2"
              >
                <Edit className="size-4" />
                Editar
              </Button>
            </div>
          }
        />
      </FadeIn>

      {/* Info General */}
      <FadeIn delay={100}>
        <DetailCard title="Información General">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailItem
              icon={FileText}
              label="Carpeta / Folio"
              value={importacion.folder}
            />
            <DetailItem
              icon={Building2}
              label="Proveedor"
              value={importacion.provider?.name ?? importacion.providerId}
            />
            <DetailItem
              icon={Truck}
              label="Transportista"
              value={importacion.transport}
            />
            <DetailItem
              icon={Calendar}
              label="Fecha de Importación"
              value={formatImportDate(importacion.importDate)}
            />
            <DetailItem
              icon={Hash}
              label="Moneda de Origen"
              value={
                <Badge variant="outline" className="text-xs">
                  {importacion.originCurrency}
                </Badge>
              }
            />
            <DetailItem
              icon={DollarSign}
              label="Tipo de Cambio"
              value={(typeof importacion.exchangeRate === 'string' ? Number(importacion.exchangeRate) : importacion.exchangeRate).toLocaleString('es-UY', {
                minimumFractionDigits: 4,
              })}
            />
            <DetailItem
              icon={Box}
              label="Cantidad de Bultos"
              value={importacion.packageCount.toString()}
            />
            <DetailItem
              icon={Scale}
              label="Peso Total (kg)"
              value={(typeof importacion.totalWeight === 'string' ? Number(importacion.totalWeight) : importacion.totalWeight).toLocaleString('es-UY', {
                minimumFractionDigits: 2,
              })}
            />
            {(() => {
              const arb = typeof importacion.arbitrage === 'string' ? Number(importacion.arbitrage) : (parseFloat(importacion.arbitrage) || 0)
              return arb > 0 ? (
                <DetailItem
                  key="arbitrage"
                  icon={Hash}
                  label="Arbitraje"
                  value={arb.toLocaleString('es-UY', {
                    minimumFractionDigits: 2,
                  })}
                />
              ) : null
            })()}
          </div>
        </DetailCard>
      </FadeIn>

      {/* Costos */}
      {costos && (
        <FadeIn delay={150}>
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-lg font-semibold">Costos de Importación</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              {/* Costos Base */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                  Costos Base ({importacion.originCurrency})
                </h4>
                <CostRow label="FOB" value={Number(costos.fobOrigin)} />
                <CostRow label="Flete" value={Number(costos.freightOrigin)} />
                <CostRow label="Seguro" value={Number(costos.insuranceOrigin)} />
                <SubtotalRow label="CIF (FOB + Flete + Seguro)" value={Number(costos.cif)} />
              </div>

              {/* Tributos Exentos */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                  Tributos Oficiales Exentos de IVA
                </h4>
                <CostRow label="Adelanto de IVA" value={Number(costos.advanceVat)} />
                <CostRow label="Guía de Tránsito" value={Number(costos.transitGuide)} />
                <CostRow label="IMADUNI" value={Number(costos.imaduni)} />
                <CostRow label="IVA" value={Number(costos.vat)} />
                <CostRow label="Recargo" value={Number(costos.surcharge)} />
                <CostRow label="Tasas Consulares" value={Number(costos.consularFees)} />
                <CostRow label="TCU" value={Number(costos.tcu)} />
                <CostRow label="Timbres AURI" value={Number(costos.auriStamps)} />
                <CostRow label="TSA" value={Number(costos.tsa)} />
                <CostRow label="Gastos Bancarios" value={Number(costos.bankCharges)} />
                <SubtotalRow label="Sub-total" value={Number(costos.subtotalA)} />
              </div>

              {/* Otros Pagos Exentos */}
              {(costos.otherExemptPayments !== undefined && Object.values(costos.otherExemptPayments).some(v => v > 0)) && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                    Otros Pagos Exentos de IVA
                  </h4>
                  <CostRow label="Otros pagos exentos" value={costos.otherExemptPayments?.otros_pagos_exentos} />
                  <SubtotalRow label="Sub-total" value={Number(costos.subtotalB)} />
                </div>
              )}

              {/* Pagos Gravados */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                  Pagos Gravados de IVA
                </h4>
                <CostRow label="Gastos de Despacho" value={Number(costos.dispatchExpenses)} />
                <CostRow label="Sobre Aduanero" value={Number(costos.customsSurcharge)} />
                <CostRow label="Honorarios" value={Number(costos.fees)} />
                <CostRow label="Flete Externo" value={Number(costos.externalFreight)} />
                <CostRow label="Seguro (gravado)" value={Number(costos.insuranceTax)} />
                <CostRow label="Flete Interno" value={Number(costos.internalFreight)} />
                <CostRow label="IVA Gravados" value={Number(costos.vatSubject)} />
                <SubtotalRow label="Sub-total" value={Number(costos.subtotalC)} />
              </div>

              {/* Totales */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Total USD</p>
                  <p className="text-lg font-bold tabular-nums">{fmt(Number(costos.fobUsd) ?? 0)}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Total Local (UYU)</p>
                  <p className="text-lg font-bold tabular-nums">{fmt((Number(costos.fobUsd) ?? 0) * (typeof costos.exchangeRate === 'string' ? Number(costos.exchangeRate) : costos.exchangeRate))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Productos */}
      <FadeIn delay={200}>
        <Card>
          <CardHeader className="pb-3 border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="size-5" />
              Productos Asociados
              <Badge variant="outline">{importacion.products?.length ?? 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {!importacion.products || importacion.products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay productos asociados a esta importación.
              </p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr] gap-3 text-xs text-muted-foreground font-medium px-1 pb-1 border-b">
                  <span>Producto</span>
                </div>
                {importacion.products.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr] items-center gap-3 py-2 border-b border-border/40 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {item.name ?? '—'}
                      </p>
                      {item.code && (
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.code}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Licitaciones */}
      <FadeIn delay={250}>
        <Card>
          <CardHeader className="pb-3 border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Link2 className="size-5" />
              Licitaciones Asociadas
              <Badge variant="outline">{importacion.licitations?.length ?? 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {!importacion.licitations || importacion.licitations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay licitaciones asociadas a esta importación.
              </p>
            ) : (
              <div className="space-y-2">
                {importacion.licitations.map((lic) => (
                  <div
                    key={lic.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {lic.numero_llamado ?? lic.id}
                      </p>
                      {lic.numero_interno && (
                        <p className="text-xs text-muted-foreground">
                          Interno: {lic.numero_interno}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/licitaciones/${lic.id}`)
                      }
                    >
                      <Ship className="size-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
