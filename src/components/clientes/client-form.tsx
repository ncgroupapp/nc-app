'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import { Cliente } from '@/types'
import { useConfirm } from "@/hooks/use-confirm";


interface ClientFormData {
  nombre: string
  identificador: string
  contactos: {
    nombre: string
    email: string
    telefono: string
    direccion: string
  }[]
}

interface ClientFormProps {
  initialData?: Cliente | null
  onSubmit: (data: unknown) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ClientForm({ initialData, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    nombre: '',
    identificador: '',
    contactos: [{ nombre: '', email: '', telefono: '', direccion: '' }]
  })
  const {confirm} = useConfirm()

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.name,
        identificador: initialData.identifier,
        contactos: initialData.contacts && initialData.contacts.length > 0
          ? initialData.contacts.map(c => ({
              nombre: c.name || '',
              email: c.email || '',
              telefono: c.phone || '',
              direccion: c.address || ''
            }))
          : [{ nombre: '', email: '', telefono: '', direccion: '' }]
      })
    } else {
      setFormData({
        nombre: '',
        identificador: '',
        contactos: [{ nombre: '', email: '', telefono: '', direccion: '' }]
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Transform back to API format
    const clientData = {
      name: formData.nombre,
      identifier: formData.identificador,
      contacts: formData.contactos.map(c => ({
        name: c.nombre,
        email: c.email,
        phone: c.telefono,
        address: c.direccion
      }))
    }

    await onSubmit(clientData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del Cliente *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, nombre: e.target.value }))
            }
            placeholder="Ej: Empresa XYZ S.A."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="identificador">Identificador/RUT *</Label>
          <Input
            id="identificador"
            value={formData.identificador}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                identificador: e.target.value,
              }))
            }
            placeholder="Ej: 987654321098"
            required
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Contactos</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  contactos: [
                    ...prev.contactos,
                    { nombre: "", email: "", telefono: "", direccion: "" },
                  ],
                }))
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Contacto
            </Button>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {formData.contactos.map((contacto, index) => (
              <div
                key={index}
                className="relative grid gap-3 p-4 border rounded-lg bg-muted/20"
              >
                {formData.contactos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    onClick={async () => {
                         const confirmed = await confirm({
                           title: "Eliminar Contacto",
                           message: `¿Estás seguro de que deseas eliminar el Contacto?`,
                           confirmText: "Eliminar",
                           cancelText: "Cancelar",
                           variant: "destructive",
                         });
                         if (confirmed) {
                           setFormData((prev) => ({
                             ...prev,
                             contactos: prev.contactos.filter(
                               (_, i) => i !== index,
                             ),
                           }));
                         }
                    }
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <div className="space-y-2">
                  <Label htmlFor={`contact-name-${index}`}>
                    Nombre del Contacto
                  </Label>
                  <Input
                    id={`contact-name-${index}`}
                    value={contacto.nombre}
                    onChange={(e) => {
                      const newContactos = [...formData.contactos];
                      newContactos[index].nombre = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        contactos: newContactos,
                      }));
                    }}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`contact-email-${index}`}>Email</Label>
                    <Input
                      id={`contact-email-${index}`}
                      type="email"
                      value={contacto.email}
                      onChange={(e) => {
                        const newContactos = [...formData.contactos];
                        newContactos[index].email = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          contactos: newContactos,
                        }));
                      }}
                      placeholder="Ej: contacto@cliente.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`contact-phone-${index}`}>Teléfono</Label>
                    <Input
                      id={`contact-phone-${index}`}
                      value={contacto.telefono}
                      onChange={(e) => {
                        const newContactos = [...formData.contactos];
                        newContactos[index].telefono = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          contactos: newContactos,
                        }));
                      }}
                      placeholder="Ej: 24011234"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`contact-address-${index}`}>Dirección</Label>
                  <textarea
                    id={`contact-address-${index}`}
                    className="w-full p-3 border rounded-md text-sm"
                    rows={2}
                    value={contacto.direccion}
                    onChange={(e) => {
                      const newContactos = [...formData.contactos];
                      newContactos[index].direccion = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        contactos: newContactos,
                      }));
                    }}
                    placeholder="Dirección del contacto..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Guardando..."
            : (initialData ? "Actualizar" : "Crear") + " Cliente"}
        </Button>
      </DialogFooter>
    </form>
  );
}
