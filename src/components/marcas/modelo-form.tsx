'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import { Model } from '@/types'

interface ModeloFormProps {
  initialData?: Model | null
  onSubmit: (data: { name: string }) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ModeloForm({ initialData, onSubmit, onCancel, isLoading }: ModeloFormProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
    } else {
      setName('')
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Modelo</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Ej: Corolla"
          required 
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogFooter>
    </form>
  )
}
