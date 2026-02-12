'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import { Brand } from '@/types'
import { Plus, Trash2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConfirm } from "@/hooks/use-confirm";


interface MarcaFormProps {
  initialData?: Brand | null
  onSubmit: (data: { name: string; models?: { name: string; id?: number }[] }) => void
  onCancel: () => void
  isLoading?: boolean
}

export function MarcaForm({ initialData, onSubmit, onCancel, isLoading }: MarcaFormProps) {
  const [name, setName] = useState('')
  const [models, setModels] = useState<{ name: string; id?: number }[]>([])
  const [newModelName, setNewModelName] = useState('')
  const {confirm} = useConfirm()

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      if (initialData.models) {
        setModels(initialData.models)
      } else {
        setModels([])
      }
    } else {
      setName('')
      setModels([])
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Enviar solo el nombre de los modelos para evitar errores de validación con campos como id, dates, etc.
    const cleanModels = models.map(m => ({ name: m.name }))
    onSubmit({ 
      name, 
      models: cleanModels.length > 0 ? cleanModels : undefined 
    })
  }

  const handleAddModel = () => {
    if (newModelName.trim()) {
      setModels([...models, { name: newModelName.trim() }])
      setNewModelName('')
    }
  }

  const handleRemoveModel = async (index: number) => {
    const confirmed = await confirm({
      title: "Eliminar Modelo",
      message: `¿Estás seguro de que deseas eliminar el modelo?`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive",
    });
     if (confirmed) {
       setModels(models.filter((_, i) => i !== index))
     }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddModel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la Marca</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Ej: Toyota"
          required 
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Modelos
        </label>
        <div className="flex gap-2">
            <Input 
              value={newModelName} 
              onChange={(e) => setNewModelName(e.target.value)} 
              placeholder="Ej: Corolla"
              onKeyDown={handleKeyDown}
            />
            <Button type="button" size="icon" variant="outline" onClick={handleAddModel}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {models.length > 0 && (
            <div className="mt-2 border rounded-md p-2 bg-muted/20">
              <ScrollArea className="h-[120px]">
                <div className="space-y-2">
                  {models.map((model, index) => (
                    <div key={index} className="flex items-center justify-between bg-background p-2 rounded border text-sm">
                      <span>{model.name}</span>
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveModel(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          <p className="text-xs text-blue-950">
            Presiona Enter o el botón + para agregar un modelo a la lista.
          </p>
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
