'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from "lucide-react";
import { Cliente } from '@/types/cliente'
import { useConfirm } from "@/hooks/use-confirm";
import { clienteSchema, ClienteForm as ClienteFormType } from '@/lib/validations/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FormGrid } from '@/components/common/form-helpers'
import { FormActionButtons } from '@/components/common/form-action-buttons'

interface ClientFormProps {
  initialData?: Cliente | null
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ClientForm({ initialData, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const { confirm } = useConfirm()

  const form = useForm<ClienteFormType>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: '',
      identificador: '',
      contactos: [{ nombre: '', email: '', telefono: '', direccion: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contactos"
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
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
    }
  }, [initialData, form])

  const handleFormSubmit = async (values: ClienteFormType) => {
    // Transform back to API format
    const clientData = {
      name: values.nombre,
      identifier: values.identificador,
      contacts: values.contactos?.map(c => ({
        name: c.nombre,
        email: c.email,
        phone: c.telefono,
        address: c.direccion
      }))
    }

    await onSubmit(clientData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-4 py-4">
          <FormGrid>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Cliente <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Empresa XYZ S.A." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identificador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identificador/RUT <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 987654321098" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormGrid>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Contactos
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ nombre: "", email: "", telefono: "", direccion: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Contacto
              </Button>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="relative grid gap-4 p-4 border rounded-lg bg-muted/10"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        Contacto #{index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: "Eliminar Contacto",
                              message: `¿Estás seguro de que deseas eliminar este contacto?`,
                              confirmText: "Eliminar",
                              cancelText: "Cancelar",
                              variant: "destructive",
                            });
                            if (confirmed) {
                              remove(index);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`contactos.${index}.nombre`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Juan Pérez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormGrid>
                      <FormField
                        control={form.control}
                        name={`contactos.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="ejemplo@correo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`contactos.${index}.telefono`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: +598 99 123 456" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FormGrid>

                    <FormField
                      control={form.control}
                      name={`contactos.${index}.direccion`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Dirección del contacto..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <FormActionButtons 
          onCancel={onCancel}
          isLoading={isLoading}
          submitText={initialData ? "Actualizar Cliente" : "Crear Cliente"}
        />
      </form>
    </Form>
  )
}
