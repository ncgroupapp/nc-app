'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { MultiSelectSearch, AutocompleteOption } from '@/components/ui/multi-select-search'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormGrid, FormFieldWrapper } from '@/components/common/form-helpers'
import { showSnackbar } from '@/components/ui/snackbar'
import { parseCalendarDate } from '@/lib/utils'

import { proveedoresService } from '@/services/proveedores.service'
import { productsService } from '@/services/products.service'
import { CreateImportacionForm, Importacion } from '@/types/importacion'
import { Proveedor } from '@/types/proveedor'
import { Product } from '@/services/products.service'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormProductRow {
  id: string
  name: string
}

interface ImportacionFormState {
  folder: string
  providerId: string
  transport: string
  arbitrage: string
  exchangeRate: string
  packageCount: string
  totalWeight: string
  originCurrency: 'EUR' | 'USD' | 'UYU'
  importDate: Date | undefined
  fobOrigin: string
  freightOrigin: string
  insuranceOrigin: string
  advanceVat: string
  transitGuide: string
  imaduni: string
  vat: string
  surcharge: string
  consularFees: string
  tcu: string
  auriStamps: string
  tsa: string
  bankCharges: string
  otherExemptPayments: string
  dispatchExpenses: string
  customsSurcharge: string
  fees: string
  externalFreight: string
  insuranceTax: string
  internalFreight: string
  products: FormProductRow[]
}

const REQUIRED_COST_FIELDS: Array<{ key: keyof ImportacionFormState; label: string }> = [
  { key: 'advanceVat', label: 'Adelanto de IVA' },
  { key: 'transitGuide', label: 'Guia de Transito' },
  { key: 'imaduni', label: 'IMADUNI' },
  { key: 'vat', label: 'IVA' },
  { key: 'surcharge', label: 'Recargo' },
  { key: 'consularFees', label: 'Tasas Consulares' },
  { key: 'tcu', label: 'TCU' },
  { key: 'auriStamps', label: 'Timbres AURI' },
  { key: 'tsa', label: 'TSA' },
  { key: 'bankCharges', label: 'Gastos Bancarios' },
  { key: 'dispatchExpenses', label: 'Gastos de Despacho' },
  { key: 'customsSurcharge', label: 'Sobre Aduanero' },
  { key: 'fees', label: 'Honorarios' },
  { key: 'externalFreight', label: 'Flete Externo' },
  { key: 'insuranceTax', label: 'Seguro (gravado)' },
  { key: 'internalFreight', label: 'Flete Interno' },
]

interface ImportacionFormProps {
  defaultValues?: Importacion
  defaultProveedor?: Proveedor
  onSubmit: (data: CreateImportacionForm) => Promise<void>
  isLoading: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseN = (val: string): number => {
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 0 : parsed
}

const formatAmount = (val: number): string => {
  if (val === 0) return '—'
  return val.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Subcomponent: Number input row ──────────────────────────────────────────

function CostRow({
  label,
  fieldKey,
  value,
  onChange,
  readOnly = false,
  displayValue,
  required = false,
  error,
}: {
  label: string
  fieldKey: string
  value: string
  onChange?: (key: string, val: string) => void
  readOnly?: boolean
  displayValue?: string
  required?: boolean
  error?: string
}) {
  return (
    <div className="py-1.5 border-b border-border/40 last:border-0">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {label}
          {required ? ' *' : ''}
        </span>
        {readOnly ? (
          <span className="text-sm font-medium tabular-nums text-right">{displayValue}</span>
        ) : (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => onChange?.(fieldKey, e.target.value)}
            className="w-36 text-right"
            placeholder="0.00"
          />
        )}
      </div>
      {!!error && <p className="text-xs text-destructive mt-1 text-right">{error}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ImportacionForm({
  defaultValues,
  defaultProveedor,
  onSubmit,
  isLoading,
}: ImportacionFormProps) {
  const router = useRouter()

  // ─── Form state ────────────────────────────────────────────────────────────

  const [form, setForm] = useState<ImportacionFormState>({
    folder: defaultValues?.folder ?? '',
    providerId: defaultValues?.providerId?.toString() ?? '',
    transport: defaultValues?.transport ?? '',
    arbitrage: defaultValues?.arbitrage?.toString() ?? '',
    exchangeRate: defaultValues?.exchangeRate?.toString() ?? '',
    packageCount: defaultValues?.packageCount?.toString() ?? '',
    totalWeight: defaultValues?.totalWeight?.toString() ?? '',
    originCurrency: (defaultValues?.originCurrency as 'EUR' | 'USD' | 'UYU') ?? 'USD',
    importDate: parseCalendarDate(defaultValues?.importDate),
    fobOrigin: defaultValues?.fobOrigin?.toString() ?? '',
    freightOrigin: defaultValues?.freightOrigin?.toString() ?? '',
    insuranceOrigin: defaultValues?.insuranceOrigin?.toString() ?? '',
    advanceVat: defaultValues?.advanceVat?.toString() ?? '',
    transitGuide: defaultValues?.transitGuide?.toString() ?? '',
    imaduni: defaultValues?.imaduni?.toString() ?? '',
    vat: defaultValues?.vat?.toString() ?? '',
    surcharge: defaultValues?.surcharge?.toString() ?? '',
    consularFees: defaultValues?.consularFees?.toString() ?? '',
    tcu: defaultValues?.tcu?.toString() ?? '',
    auriStamps: defaultValues?.auriStamps?.toString() ?? '',
    tsa: defaultValues?.tsa?.toString() ?? '',
    bankCharges: defaultValues?.bankCharges?.toString() ?? '',
    otherExemptPayments:
      defaultValues?.otherExemptPayments?.otros_pagos_exentos?.toString() ?? '',
    dispatchExpenses: defaultValues?.dispatchExpenses?.toString() ?? '',
    customsSurcharge: defaultValues?.customsSurcharge?.toString() ?? '',
    fees: defaultValues?.fees?.toString() ?? '',
    externalFreight: defaultValues?.externalFreight?.toString() ?? '',
    insuranceTax: defaultValues?.insuranceTax?.toString() ?? '',
    internalFreight: defaultValues?.internalFreight?.toString() ?? '',
    products: defaultValues?.products?.map((p) => ({
      id: p.id?.toString() || '',
      name: p.name || '',
    })) ?? [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // ─── Provider async search ─────────────────────────────────────────────────

  const [proveedorOptions, setProveedorOptions] = useState<AutocompleteOption[]>(
    defaultProveedor
      ? [{ id: defaultProveedor.id, label: defaultProveedor.name }]
      : [],
  )
  const [proveedorSearch, setProveedorSearch] = useState('')

  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const res = await proveedoresService.getAll({ search: proveedorSearch, limit: 20 })
        setProveedorOptions(
          res.data.map((p) => ({ id: p.id, label: p.name })),
        )
      } catch {
        // ignore search errors
      }
    }, 300)
    return () => clearTimeout(id)
  }, [proveedorSearch])

  // ─── Products async search ─────────────────────────────────────────────────

  const [productSearch, setProductSearch] = useState('')
  const [productOptions, setProductOptions] = useState<AutocompleteOption[]>([])

  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const res = await productsService.getAll({ search: productSearch, limit: 20 })
        setProductOptions(
          res.data.map((p: Product) => ({
            id: p.id.toString(),
            label: `${p.name}${p.code ? ` (${p.code})` : ''}`,
          })),
        )
      } catch {
        // ignore
      }
    }, 300)
    return () => clearTimeout(id)
  }, [productSearch])

  // ─── Derived calculations ──────────────────────────────────────────────────

  const calcs = useMemo(() => {
    const cif = parseN(form.fobOrigin) + parseN(form.freightOrigin) + parseN(form.insuranceOrigin)

    const subtotalA =
      parseN(form.advanceVat) +
      parseN(form.transitGuide) +
      parseN(form.imaduni) +
      parseN(form.vat) +
      parseN(form.surcharge) +
      parseN(form.consularFees) +
      parseN(form.tcu) +
      parseN(form.auriStamps) +
      parseN(form.tsa) +
      parseN(form.bankCharges)

    const subtotalB = parseN(form.otherExemptPayments)

    const baseGravada =
      parseN(form.dispatchExpenses) +
      parseN(form.customsSurcharge) +
      parseN(form.fees) +
      parseN(form.externalFreight) +
      parseN(form.insuranceTax) +
      parseN(form.internalFreight)

    const subtotalC = baseGravada

    const tipoCambio = parseN(form.exchangeRate)
    const totalOrigen = cif + subtotalA + subtotalB + subtotalC

    const totalLocal = tipoCambio > 0 ? totalOrigen * tipoCambio : 0
    const totalUsd =
      form.originCurrency === 'USD'
        ? totalOrigen
        : tipoCambio > 0
        ? totalLocal / tipoCambio
        : 0

    return { cif, subtotalA, subtotalB, subtotalC, totalOrigen, totalLocal, totalUsd }
  }, [form])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const setField = <K extends keyof ImportacionFormState>(
    key: K,
    value: ImportacionFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const setCost = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const addProducto = (productId: string) => {
    if (!productId) return
    const alreadyAdded = form.products.some((p) => p.id === productId)
    if (alreadyAdded) {
      showSnackbar('Ese producto ya está en la lista', 'error')
      return
    }
    const option = productOptions.find((o) => o.id.toString() === productId)
    setForm((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: productId,
          name: option?.label ?? productId,
        },
      ],
    }))
    setProductSearch('')
  }

  const removeProducto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }))
  }

  // ─── Validation & Submit ───────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.folder.trim()) newErrors.folder = 'La carpeta/folio es obligatoria'
    if (!form.providerId) newErrors.providerId = 'El proveedor es obligatorio'
    if (!form.transport.trim()) newErrors.transport = 'El transportista es obligatorio'
    if (!form.exchangeRate || parseN(form.exchangeRate) <= 0)
      newErrors.exchangeRate = 'El tipo de cambio debe ser mayor a 0'
    if (!form.packageCount || parseN(form.packageCount) < 1)
      newErrors.packageCount = 'La cantidad de bultos debe ser mayor a 0'
    if (!form.totalWeight || parseN(form.totalWeight) < 0)
      newErrors.totalWeight = 'El peso total es obligatorio'
    if (!form.importDate) newErrors.importDate = 'La fecha de importación es obligatoria'

    for (const field of REQUIRED_COST_FIELDS) {
      const rawValue = String(form[field.key] ?? '').trim()
      if (!rawValue) {
        newErrors[field.key] = `${field.label} es obligatorio`
        continue
      }

      const parsed = Number(rawValue)
      if (Number.isNaN(parsed) || parsed < 0) {
        newErrors[field.key] = `${field.label} debe ser un numero mayor o igual a 0`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload: CreateImportacionForm = {
      folder: form.folder.trim(),
      providerId: Number(form.providerId),
      transport: form.transport.trim(),
      arbitrage: form.arbitrage || undefined,
      exchangeRate: parseN(form.exchangeRate),
      packageCount: Math.round(parseN(form.packageCount)),
      totalWeight: parseN(form.totalWeight),
      originCurrency: form.originCurrency,
      importDate: form.importDate
        ? format(form.importDate, 'yyyy-MM-dd')
        : '',
      fobOrigin: Math.max(0, parseN(form.fobOrigin)),
      fobUsd: Math.max(0, parseN(form.fobOrigin)),
      freightOrigin: Math.max(0, parseN(form.freightOrigin)),
      freightUsd: Math.max(0, parseN(form.freightOrigin)),
      insuranceOrigin: Math.max(0, parseN(form.insuranceOrigin)),
      insuranceUsd: Math.max(0, parseN(form.insuranceOrigin)),
      advanceVatRate: parseN(form.advanceVat),
      transitGuideRate: parseN(form.transitGuide),
      imaduniRate: parseN(form.imaduni),
      vatRate: parseN(form.vat),
      surchargeRate: parseN(form.surcharge),
      consularFeesRate: parseN(form.consularFees),
      tcuRate: parseN(form.tcu),
      auriStampsRate: parseN(form.auriStamps),
      tsaRate: parseN(form.tsa),
      bankCharges: parseN(form.bankCharges),
      otherExemptPayments: form.otherExemptPayments ? { otros_pagos_exentos: parseN(form.otherExemptPayments) } : undefined,
      dispatchExpensesRate: parseN(form.dispatchExpenses),
      customsSurchargeRate: parseN(form.customsSurcharge),
      feesRate: parseN(form.fees),
      externalFreightRate: parseN(form.externalFreight),
      insuranceTaxRate: parseN(form.insuranceTax),
      internalFreightRate: parseN(form.internalFreight),
      productIds: form.products.map((p) => Number(p.id)),
      licitationIds: [],
    }

    await onSubmit(payload)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── SECCIÓN 1: Datos Generales ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos Generales</CardTitle>
        </CardHeader>
        <CardContent>
          <FormGrid columns={2}>
            <FormFieldWrapper
              label="Carpeta / Folio"
              required
              error={errors.folder}
            >
              <Input
                value={form.folder}
                onChange={(e) => setField('folder', e.target.value)}
                placeholder="Ej: 2024-001"
              />
            </FormFieldWrapper>

            <FormFieldWrapper label="Proveedor" required error={errors.providerId}>
              <MultiSelectSearch
                options={proveedorOptions}
                selectedValues={form.providerId ? [form.providerId] : []}
                onSelect={(val) => setField('providerId', val.toString())}
                onRemove={() => setField('providerId', '')}
                placeholder="Buscar proveedor..."
                searchPlaceholder="Buscar proveedor..."
                emptyMessage="Sin resultados"
                searchValue={proveedorSearch}
                onSearchValueChange={setProveedorSearch}
                shouldFilter={false}
                single
              />
            </FormFieldWrapper>

            <FormFieldWrapper
              label="Transportista"
              required
              error={errors.transport}
            >
              <Input
                value={form.transport}
                onChange={(e) => setField('transport', e.target.value)}
                placeholder="Nombre del transportista"
              />
            </FormFieldWrapper>

            <FormFieldWrapper label="Arbitraje" error={errors.arbitrage}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.arbitrage}
                onChange={(e) => setField('arbitrage', e.target.value)}
                placeholder="Opcional"
              />
            </FormFieldWrapper>

            <FormFieldWrapper
              label="Moneda de Origen"
              required
              error={errors.originCurrency}
            >
              <Select
                value={form.originCurrency}
                onValueChange={(val) =>
                  setField('originCurrency', val as 'EUR' | 'USD' | 'UYU')
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD — Dólar Estadounidense</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="UYU">UYU — Peso Uruguayo</SelectItem>
                </SelectContent>
              </Select>
            </FormFieldWrapper>

            <FormFieldWrapper
              label="Tipo de Cambio"
              required
              error={errors.exchangeRate}
              description={`Valor de 1 ${form.originCurrency} en UYU`}
            >
              <Input
                type="number"
                min="0"
                step="0.0001"
                value={form.exchangeRate}
                onChange={(e) => setField('exchangeRate', e.target.value)}
                placeholder="Ej: 42.50"
              />
            </FormFieldWrapper>

            <FormFieldWrapper
              label="Cantidad de Bultos"
              required
              error={errors.packageCount}
            >
              <Input
                type="number"
                min="1"
                step="1"
                value={form.packageCount}
                onChange={(e) => setField('packageCount', e.target.value)}
                placeholder="0"
              />
            </FormFieldWrapper>

            <FormFieldWrapper
              label="Peso Total (kg)"
              required
              error={errors.totalWeight}
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.totalWeight}
                onChange={(e) => setField('totalWeight', e.target.value)}
                placeholder="0.00"
              />
            </FormFieldWrapper>

            <FormFieldWrapper
              label="Fecha de Importación"
              required
              error={errors.importDate}
            >
              <DatePicker
                date={form.importDate}
                setDate={(d) => setField('importDate', d)}
              />
            </FormFieldWrapper>
          </FormGrid>
        </CardContent>
      </Card>

      {/* ── SECCIÓN 2A: Costos Base ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Costos Base{' '}
            <span className="text-muted-foreground font-normal text-sm">
              ({form.originCurrency})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CostRow
            label="FOB (Free On Board)"
            fieldKey="fobOrigin"
            value={form.fobOrigin}
            onChange={setCost}
          />
          <CostRow
            label="Flete"
            fieldKey="freightOrigin"
            value={form.freightOrigin}
            onChange={setCost}
          />
          <CostRow
            label="Seguro"
            fieldKey="insuranceOrigin"
            value={form.insuranceOrigin}
            onChange={setCost}
          />
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-2 mt-1 bg-muted/40 rounded px-2">
            <span className="text-sm font-semibold">CIF (FOB + Flete + Seguro)</span>
            <span className="text-sm font-bold tabular-nums text-right">
              {formatAmount(calcs.cif)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── SECCIÓN 2B: Tributos Oficiales Exentos de IVA ─────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tributos Oficiales Exentos de IVA{' '}
            <span className="text-muted-foreground font-normal text-sm">
              ({form.originCurrency})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CostRow label="Adelanto de IVA" fieldKey="advanceVat" value={form.advanceVat} onChange={setCost} required error={errors.advanceVat} />
          <CostRow label="Guia de Transito" fieldKey="transitGuide" value={form.transitGuide} onChange={setCost} required error={errors.transitGuide} />
          <CostRow label="IMADUNI" fieldKey="imaduni" value={form.imaduni} onChange={setCost} required error={errors.imaduni} />
          <CostRow label="IVA" fieldKey="vat" value={form.vat} onChange={setCost} required error={errors.vat} />
          <CostRow label="Recargo" fieldKey="surcharge" value={form.surcharge} onChange={setCost} required error={errors.surcharge} />
          <CostRow label="Tasas Consulares" fieldKey="consularFees" value={form.consularFees} onChange={setCost} required error={errors.consularFees} />
          <CostRow label="TCU" fieldKey="tcu" value={form.tcu} onChange={setCost} required error={errors.tcu} />
          <CostRow label="Timbres AURI" fieldKey="auriStamps" value={form.auriStamps} onChange={setCost} required error={errors.auriStamps} />
          <CostRow label="TSA" fieldKey="tsa" value={form.tsa} onChange={setCost} required error={errors.tsa} />
          <CostRow label="Gastos Bancarios (monto fijo)" fieldKey="bankCharges" value={form.bankCharges} onChange={setCost} required error={errors.bankCharges} />
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-2 mt-1 bg-muted/40 rounded px-2">
            <span className="text-sm font-semibold">Sub-total</span>
            <span className="text-sm font-bold tabular-nums text-right">
              {formatAmount(calcs.subtotalA)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── SECCIÓN 2C: Otros Pagos Exentos de IVA ────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Otros Pagos Exentos de IVA{' '}
            <span className="text-muted-foreground font-normal text-sm">
              ({form.originCurrency})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CostRow
            label="Otros pagos exentos"
            fieldKey="otherExemptPayments"
            value={form.otherExemptPayments}
            onChange={setCost}
          />
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-2 mt-1 bg-muted/40 rounded px-2">
            <span className="text-sm font-semibold">Sub-total</span>
            <span className="text-sm font-bold tabular-nums text-right">
              {formatAmount(calcs.subtotalB)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── SECCIÓN 2D: Pagos Gravados de IVA ─────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Pagos Gravados de IVA{' '}
            <span className="text-muted-foreground font-normal text-sm">
              ({form.originCurrency})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CostRow label="Gastos de Despacho" fieldKey="dispatchExpenses" value={form.dispatchExpenses} onChange={setCost} required error={errors.dispatchExpenses} />
          <CostRow label="Sobre Aduanero" fieldKey="customsSurcharge" value={form.customsSurcharge} onChange={setCost} required error={errors.customsSurcharge} />
          <CostRow label="Honorarios" fieldKey="fees" value={form.fees} onChange={setCost} required error={errors.fees} />
          <CostRow label="Flete Externo" fieldKey="externalFreight" value={form.externalFreight} onChange={setCost} required error={errors.externalFreight} />
          <CostRow label="Seguro (gravado)" fieldKey="insuranceTax" value={form.insuranceTax} onChange={setCost} required error={errors.insuranceTax} />
          <CostRow label="Flete Interno" fieldKey="internalFreight" value={form.internalFreight} onChange={setCost} required error={errors.internalFreight} />
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-2 mt-1 bg-muted/40 rounded px-2">
            <span className="text-sm font-semibold">Sub-total</span>
            <span className="text-sm font-bold tabular-nums text-right">
              {formatAmount(calcs.subtotalC)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Totales ────────────────────────────────────────────────────── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">
                Total en {form.originCurrency}
              </p>
              <p className="text-lg font-bold tabular-nums">
                {formatAmount(calcs.totalOrigen)}
              </p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Total Local (UYU)</p>
              <p className="text-lg font-bold tabular-nums">
                {parseN(form.exchangeRate) > 0 ? formatAmount(calcs.totalLocal) : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SECCIÓN 3: Productos ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos Asociados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product search to add */}
          <div className="flex gap-2">
            <div className="flex-1">
              <MultiSelectSearch
                options={productOptions}
                selectedValues={[]}
                onSelect={(val) => addProducto(val.toString())}
                onRemove={() => {}}
                placeholder="Buscar producto para agregar..."
                searchPlaceholder="Nombre o SKU del producto..."
                emptyMessage="Sin resultados"
                searchValue={productSearch}
                onSearchValueChange={setProductSearch}
                shouldFilter={false}
                single
                hideTags
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const first = productOptions[0]
                if (first) addProducto(first.id.toString())
              }}
              disabled={productOptions.length === 0}
              className="shrink-0"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {/* Product list */}
          {form.products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay productos asociados. Buscá un producto arriba para agregar.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto] gap-2 text-xs text-muted-foreground px-1">
                <span>Producto</span>
                <span />
              </div>
              {form.products.map((prod, index) => (
                <div
                  key={prod.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 p-2 bg-muted/30 rounded-md"
                >
                  <span className="text-sm truncate">{prod.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProducto(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Footer Actions ─────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pb-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Importación'}
        </Button>
      </div>
    </form>
  )
}
