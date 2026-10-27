'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { handleActionError } from '@/lib/error-handler'
import { ProfitabilitySettings, rentabilidadService } from '@/services/rentabilidad.service'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: ProfitabilitySettings | null
  onSaved: (settings: ProfitabilitySettings) => void
}

export function SettingsDialog({ open, onOpenChange, settings, onSaved }: SettingsDialogProps) {
  const [exchangeRate, setExchangeRate] = useState('')
  const [minMargin, setMinMargin] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setExchangeRate(settings?.exchangeRate ? String(settings.exchangeRate) : '')
    setMinMargin(String(settings?.minMargin ?? 5))
  }, [open, settings])

  const rate = Number(exchangeRate.replace(',', '.'))
  const margin = Number(minMargin.replace(',', '.'))
  const valid = rate > 0 && minMargin !== '' && margin >= 0 && margin <= 100

  const save = async () => {
    if (!valid) return
    setSaving(true)
    try {
      onSaved(await rentabilidadService.updateSettings({ exchangeRate: rate, minMargin: margin }))
      onOpenChange(false)
    } catch (error) {
      handleActionError(error, 'No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Tipo de cambio y margen mínimo</DialogTitle>
          <DialogDescription>
            Se usan para pasar todo a dólares y marcar en rojo las licitaciones con poco margen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exchange-rate">Pesos uruguayos por 1 dólar</Label>
            <Input
              id="exchange-rate"
              inputMode="decimal"
              placeholder="Ej: 40,50"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min-margin">Margen mínimo (%)</Label>
            <Input
              id="min-margin"
              inputMode="decimal"
              value={minMargin}
              onChange={(e) => setMinMargin(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={!valid || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
