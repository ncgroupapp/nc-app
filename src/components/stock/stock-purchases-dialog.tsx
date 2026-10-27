'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showSnackbar } from '@/components/ui/snackbar'
import { Textarea } from '@/components/ui/textarea'

import { useConfirm } from '@/hooks/use-confirm'
import { handleActionError } from '@/lib/error-handler'
import { proveedoresService } from '@/services/proveedores.service'
import {
  STOCK_CURRENCIES,
  StockCurrency,
  StockItem,
  StockPurchase,
  StockPurchaseForm,
  formatMoney,
  stockService,
} from '@/services/stock.service'
import { Proveedor } from '@/types/proveedor'

const purchaseSchema = z
  .object({
    providerId: z.number().nullable(),
    providerName: z.string().trim(),
    purchaseDate: z.string(),
    orderNumber: z.string().trim(),
    quantity: z.number({ message: 'Ingresá la cantidad' }).positive('La cantidad debe ser mayor a 0'),
    unitCost: z.number({ message: 'Ingresá el costo unitario' }).min(0, 'El costo no puede ser negativo'),
    currency: z.enum(STOCK_CURRENCIES),
    notes: z.string().trim(),
  })
  .refine((data) => data.providerId !== null || data.providerName.length > 0, {
    message: 'Elegí un proveedor o escribí su nombre',
    path: ['providerName'],
  })

type FormState = {
  providerId: number | null
  providerName: string
  purchaseDate: string
  orderNumber: string
  quantity: string
  unitCost: string
  currency: StockCurrency
  notes: string
}

const emptyForm = (): FormState => ({
  providerId: null,
  providerName: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  orderNumber: '',
  quantity: '',
  unitCost: '',
  currency: 'USD',
  notes: '',
})

function toFormState(purchase: StockPurchase): FormState {
  return {
    providerId: purchase.providerId,
    providerName: purchase.providerId ? '' : purchase.providerName ?? '',
    purchaseDate: purchase.purchaseDate ?? '',
    orderNumber: purchase.orderNumber ?? '',
    quantity: String(purchase.quantity),
    unitCost: String(purchase.unitCost),
    currency: purchase.currency,
    notes: purchase.notes ?? '',
  }
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

interface StockPurchasesDialogProps {
  item: StockItem | null
  onOpenChange: (open: boolean) => void
  /** Called after any change so the parent can refresh the list and totals. */
  onChanged: () => void
}

export function StockPurchasesDialog({ item, onOpenChange, onChanged }: StockPurchasesDialogProps) {
  const { confirm } = useConfirm()

  const [purchases, setPurchases] = useState<StockPurchase[]>([])
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [isSaving, setIsSaving] = useState(false)

  const [providerSearch, setProviderSearch] = useState('')
  const [providerOptions, setProviderOptions] = useState<Proveedor[]>([])

  const loadPurchases = useCallback(async (productId: number) => {
    setIsLoadingPurchases(true)
    try {
      setPurchases(await stockService.getPurchases(productId))
    } catch (error) {
      handleActionError(error, 'Error al cargar las compras')
    } finally {
      setIsLoadingPurchases(false)
    }
  }, [])

  useEffect(() => {
    if (!item) return
    setForm(emptyForm())
    setEditingId(null)
    setErrors({})
    loadPurchases(item.id)
  }, [item, loadPurchases])

  useEffect(() => {
    if (!item) return
    const timeoutId = setTimeout(async () => {
      try {
        const response = await proveedoresService.getAll({ search: providerSearch, limit: 20 })
        setProviderOptions(response.data || [])
      } catch (error) {
        console.error('Error searching providers:', error)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [providerSearch, item])

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const startEdit = (purchase: StockPurchase) => {
    setEditingId(purchase.id)
    setForm(toFormState(purchase))
    setErrors({})
    if (purchase.providerId && purchase.providerName) {
      setProviderOptions((prev) =>
        prev.some((p) => Number(p.id) === purchase.providerId)
          ? prev
          : [{ id: purchase.providerId, name: purchase.providerName } as unknown as Proveedor, ...prev],
      )
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm())
    setErrors({})
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!item) return

    const parsed = purchaseSchema.safeParse({
      ...form,
      quantity: form.quantity === '' ? undefined : Number(form.quantity),
      unitCost: form.unitCost === '' ? undefined : Number(form.unitCost),
    })
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState
        fieldErrors[key] ??= issue.message
      }
      setErrors(fieldErrors)
      return
    }

    const data = parsed.data
    const payload: StockPurchaseForm = {
      providerId: data.providerId,
      providerName: data.providerId ? null : data.providerName,
      purchaseDate: data.purchaseDate || null,
      orderNumber: data.orderNumber || null,
      quantity: data.quantity,
      unitCost: data.unitCost,
      currency: data.currency,
      notes: data.notes || null,
    }

    setIsSaving(true)
    try {
      if (editingId) {
        await stockService.updatePurchase(editingId, payload)
        showSnackbar('Compra actualizada', 'success')
      } else {
        await stockService.createPurchase(item.id, payload)
        showSnackbar('Compra registrada', 'success')
      }
      cancelEdit()
      await loadPurchases(item.id)
      onChanged()
    } catch (error) {
      handleActionError(error, 'Error al guardar la compra')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (purchase: StockPurchase) => {
    if (!item) return
    const confirmed = await confirm({
      title: 'Eliminar compra',
      message: `¿Eliminar la compra a ${purchase.providerName ?? 'proveedor'} del ${formatDate(purchase.purchaseDate)}?`,
      variant: 'destructive',
    })
    if (!confirmed) return
    try {
      await stockService.deletePurchase(purchase.id)
      showSnackbar('Compra eliminada', 'success')
      if (editingId === purchase.id) cancelEdit()
      await loadPurchases(item.id)
      onChanged()
    } catch (error) {
      handleActionError(error, 'Error al eliminar la compra')
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[860px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-brand-navy">Compras de {item?.name}</DialogTitle>
          <DialogDescription>
            {item?.code ? `Código ${item.code} · ` : ''}Stock actual: {item?.stockQuantity ?? 0} unidades.
            Las compras registran el costo y a quién se compró; no modifican el stock.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Proveedor</th>
                <th className="px-3 py-2">Pedido</th>
                <th className="px-3 py-2 text-right">Cant.</th>
                <th className="px-3 py-2 text-right">Costo unit.</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {isLoadingPurchases ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    Todavía no hay compras registradas para este producto.
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className={`border-t ${editingId === purchase.id ? 'bg-accent' : ''}`}>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(purchase.purchaseDate)}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-brand-navy">{purchase.providerName ?? '—'}</div>
                      {purchase.notes && <div className="text-xs text-muted-foreground">{purchase.notes}</div>}
                    </td>
                    <td className="px-3 py-2">{purchase.orderNumber ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{purchase.quantity}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatMoney(purchase.unitCost, purchase.currency)}</td>
                    <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                      {formatMoney(purchase.unitCost * purchase.quantity, purchase.currency)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(purchase)} aria-label="Editar compra">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(purchase)} aria-label="Eliminar compra">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-secondary/40 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue">
            {editingId ? 'Editar compra' : 'Registrar compra'}
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Proveedor</Label>
              <MultiSelectSearch
                single
                options={providerOptions.map((p) => ({ id: Number(p.id), label: p.name.trim() }))}
                selectedValues={form.providerId ? [form.providerId] : []}
                onSelect={(value) => {
                  updateField('providerId', Number(value))
                  updateField('providerName', '')
                }}
                onRemove={() => updateField('providerId', null)}
                placeholder="Elegir proveedor dado de alta"
                searchPlaceholder="Buscar proveedor..."
                searchValue={providerSearch}
                onSearchValueChange={setProviderSearch}
                shouldFilter={false}
              />
              {!form.providerId && (
                <Input
                  placeholder="…o escribí el nombre si no está dado de alta"
                  value={form.providerName}
                  onChange={(e) => updateField('providerName', e.target.value)}
                />
              )}
              {errors.providerName && <p className="text-xs text-destructive">{errors.providerName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="purchaseDate">Fecha de compra</Label>
                <Input id="purchaseDate" type="date" value={form.purchaseDate} onChange={(e) => updateField('purchaseDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orderNumber">N° de pedido</Label>
                <Input id="orderNumber" value={form.orderNumber} onChange={(e) => updateField('orderNumber', e.target.value)} placeholder="Ej: 333" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input id="quantity" type="number" min="0" step="1" value={form.quantity} onChange={(e) => updateField('quantity', e.target.value)} />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unitCost">Costo unitario (sin IVA)</Label>
                <Input id="unitCost" type="number" min="0" step="0.01" value={form.unitCost} onChange={(e) => updateField('unitCost', e.target.value)} />
                {errors.unitCost && <p className="text-xs text-destructive">{errors.unitCost}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Moneda</Label>
                <Select value={form.currency} onValueChange={(value) => updateField('currency', value as StockCurrency)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {editingId && (
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving}>
                Cancelar edición
              </Button>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {editingId ? 'Guardar cambios' : 'Registrar compra'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
