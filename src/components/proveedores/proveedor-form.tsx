'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import { Proveedor } from '@/types'
import { useConfirm } from "@/hooks/use-confirm";
import { useBrandsStore } from '@/stores/brands/brandsStore'
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from "sonner"


// Local interface to match the requirement before types are fully updated
interface ContactoData {
  name: string
  email: string
  phone: string
  address: string
}

interface ProveedorFormData {
  name: string
  rut: string
  country: string
  brand?: string
  contacts: ContactoData[]
}

interface ProveedorFormProps {
  initialData?: Proveedor | null
  // using unknown to avoid strict type conflicts if CreateProveedorForm is not yet updated
  onSubmit: (data: unknown) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ProveedorForm({ initialData, onSubmit, onCancel, isLoading = false }: ProveedorFormProps) {
  const { brands, fetchBrands } = useBrandsStore()
  const [brandSearch, setBrandSearch] = useState('')
  const debouncedBrandSearch = useDebounce(brandSearch, 500)
  const [selectedBrand, setSelectedBrand] = useState<string>("")

  const [formData, setFormData] = useState<ProveedorFormData>({
    name: '',
    rut: '',
    country: '',
    contacts: [{ name: '', email: '', phone: '', address: '' }]
  })

  const { confirm } = useConfirm();

  useEffect(() => {
    fetchBrands(1, debouncedBrandSearch)
  }, [debouncedBrandSearch, fetchBrands])

  useEffect(() => {
    if (initialData) {
      // Handle brand whether it's an object (Brand) or string (legacy/mapped)
      const brandName = typeof initialData.brand === 'object' && initialData.brand !== null 
        ? initialData.brand 
        : (typeof initialData.brand === 'string' ? initialData.brand : undefined);
      
      if (brandName) {
        setSelectedBrand(brandName)
      } else {
        setSelectedBrand("")
      }
      
      setFormData({
        name: initialData.name || '',
        rut: initialData.rut || '',
        country: initialData.country || '',
        brand: brandName || '',
        contacts: initialData.contacts && initialData.contacts.length > 0
          ? initialData.contacts.map((c) => ({
              name: c.name || '',
              email: c.email || '',
              phone: c.phone || '',
              address: c.address || ''
            }))
          : [{ name: '', email: '', phone: '', address: '' }]
      })
    } else {
      setSelectedBrand('')
      setFormData({
        name: '',
        rut: '',
        country: '',
        contacts: [{ name: '', email: '', phone: '', address: '' }]
      })
    }
  }, [initialData])

  const handleContactChange = (index: number, field: keyof ContactoData, value: string) => {
    const newContacts = [...formData.contacts]
    newContacts[index] = { ...newContacts[index], [field]: value }
    setFormData(prev => ({ ...prev, contacts: newContacts }))
  }

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { name: '', email: '', phone: '', address: '' }]
    }))
  }

  const removeContact = async (index: number) => {
    const confirmed = await confirm({ 
      title: 'Eliminar Contacto', 
      message: '¿Está seguro que desea eliminar este contacto?',
      variant: 'destructive'
    })
    if (formData.contacts.length > 1) {
      if (confirmed) {    
        setFormData(prev => ({
          ...prev,
          contacts: prev.contacts.filter((_, i) => i !== index)
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!formData.rut.trim()) {
      toast.error('El RUT es obligatorio')
      return
    }
    if (!formData.country.trim()) {
      toast.error('El país es obligatorio')
      return
    }

    const payload = {
      name: formData.name,
      rut: formData.rut,
      country: formData.country,
      brand: selectedBrand || formData.brand || '',
      contacts: formData.contacts.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
      }))
    }

    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        {/* Basic Information */}
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
          <Input
            id="nombre"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ej: Proveedor S.A."
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rut">RUT <span className="text-red-500">*</span></Label>
            <Input
              id="rut"
              value={formData.rut}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, rut: e.target.value }))
              }
              placeholder="Ej: 76.543.210-K"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pais">País <span className="text-red-500">*</span></Label>
            <Input
              id="pais"
              value={formData.country}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, country: e.target.value }))
              }
              placeholder="Ej: Chile"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <MultiSelectSearch
                single={true}
                searchValue={brandSearch}
                onSearchValueChange={setBrandSearch}
                options={[
                  ...brands.map((b) => ({
                    id: b.name, // Use name as ID since we want to store and display the name
                    label: b.name,
                  })),
                  ...(selectedBrand && !brands.some((b) => b.name === selectedBrand)
                    ? [{ id: selectedBrand, label: selectedBrand }]
                    : []),
                ]}
                selectedValues={formData.brand ? [formData.brand] : []}
                onSelect={(value) => {
                   const brandName = String(value);
                   setSelectedBrand(brandName)
                   setFormData((prev) => ({
                    ...prev,
                    brand: brandName,
                  }));
                }}
                onRemove={() => {
                   setSelectedBrand('')
                   setFormData((prev) => {
                       // eslint-disable-next-line @typescript-eslint/no-unused-vars
                       const { brand, ...rest } = prev;
                       return { ...rest, brand: undefined };
                   });
                }}
                placeholder="Seleccionar marca..."
                searchPlaceholder="Buscar marca..."
                emptyMessage="No se encontraron marcas."
            />
          </div>

        {/* Dynamic Contacts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <Label>Contactos</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addContact}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar Contacto
            </Button>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {formData.contacts.map((contact, index) => (
              <div
                key={index}
                className="relative grid gap-3 p-4 border rounded-lg bg-muted/20"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={() => removeContact(index)}
                  disabled={formData.contacts.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>

                <div className="space-y-2">
                  <Label htmlFor={`contact-name-${index}`}>
                    Nombre del Contacto
                  </Label>
                  <Input
                    id={`contact-name-${index}`}
                    value={contact.name}
                    onChange={(e) => {
                      const newContacts = [...formData.contacts];
                      newContacts[index].name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        contacts: newContacts,
                      }));
                    }}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={contact.email}
                      onChange={(e) =>
                        handleContactChange(index, "email", e.target.value)
                      }
                      placeholder="email@ejemplo.com"
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Teléfono</Label>
                    <Input
                      value={contact.phone}
                      onChange={(e) =>
                        handleContactChange(index, "phone", e.target.value)
                      }
                      placeholder="+56 9..."
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`contact-address-${index}`}>Dirección</Label>
                  <textarea
                    id={`contact-address-${index}`}
                    className="w-full p-3 border rounded-md text-sm"
                    rows={2}
                    value={contact.address}
                    onChange={(e) => {
                      const newContacts = [...formData.contacts];
                      newContacts[index].address = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        contacts: newContacts,
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
          {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
