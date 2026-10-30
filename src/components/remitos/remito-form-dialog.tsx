"use client";

import { useEffect, useState } from "react";
import { Gavel, Loader2, Package, Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showSnackbar } from "@/components/ui/snackbar";
import { SearchPicker } from "@/components/remitos/search-picker";
import { handleActionError } from "@/lib/error-handler";
import { clientesService } from "@/services/clientes.service";
import { licitacionesService, Licitation } from "@/services/licitaciones.service";
import { productsService, Product } from "@/services/products.service";
import { Remito, RemitoInput, RemitoItem, formatRemitoNumber, remitosService } from "@/services/remitos.service";
import { Cliente } from "@/types/cliente";

interface RemitoFormDialogProps {
  open: boolean;
  /** Remito to edit; null creates a new one. */
  remito: Remito | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (remito: Remito) => void;
}

const todayUy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });

const emptyForm = (): RemitoInput => ({
  date: todayUy(),
  clientId: null,
  licitationId: null,
  receiverName: "",
  receiverRut: "",
  receiverAddress: "",
  receiverCity: "",
  receiverPhone: "",
  purchaseOrder: "",
  reference: "",
  notes: "",
  items: [],
});

const blankToNull = (value?: string | null) => (value?.trim() ? value.trim() : null);

export function RemitoFormDialog({ open, remito, onOpenChange, onSaved }: RemitoFormDialogProps) {
  const [form, setForm] = useState<RemitoInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      remito
        ? {
            ...emptyForm(),
            ...remito,
            items: remito.items.map(({ productId, code, description, quantity }) => ({ productId, code, description, quantity })),
          }
        : emptyForm(),
    );
  }, [open, remito]);

  const set = <K extends keyof RemitoInput>(key: K, value: RemitoInput[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const setItem = (index: number, patch: Partial<RemitoItem>) =>
    setForm((prev) => ({ ...prev, items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));

  const applyClient = (client: Cliente) => {
    const contact = client.contacts?.find((c) => c.address) ?? client.contacts?.[0];
    setForm((prev) => ({
      ...prev,
      clientId: Number(client.id),
      receiverName: client.name,
      receiverRut: client.identifier ?? "",
      receiverAddress: contact?.address ?? prev.receiverAddress,
      receiverPhone: contact?.phone ?? prev.receiverPhone,
    }));
  };

  const applyLicitation = async (licitation: Licitation) => {
    setLoadingDraft(true);
    try {
      const draft = await remitosService.draftFromLicitation(licitation.id);
      setForm((prev) => ({
        ...prev,
        ...draft,
        date: prev.date,
        notes: prev.notes,
        items: draft.items.length > 0 ? draft.items : prev.items,
      }));
      showSnackbar(
        draft.items.length > 0
          ? `Se cargaron ${draft.items.length} ítems de la licitación`
          : "La licitación no tiene ítems cotizados; agregalos a mano",
        draft.items.length > 0 ? "success" : "info",
      );
    } catch (error) {
      handleActionError(error, "No se pudo cargar la licitación");
    } finally {
      setLoadingDraft(false);
    }
  };

  const addProduct = (product: Product) =>
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: product.id,
          code: product.code ?? "",
          description: [product.name, product.brand, product.model].filter(Boolean).join(" "),
          quantity: 1,
        },
      ],
    }));

  const validItems = form.items.filter((item) => item.description.trim() && Number(item.quantity) > 0);
  const canSave = form.receiverName.trim() && validItems.length > 0 && validItems.length === form.items.length;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const payload: RemitoInput = {
      date: form.date || todayUy(),
      clientId: form.clientId ?? null,
      licitationId: form.licitationId ?? null,
      receiverName: form.receiverName.trim(),
      receiverRut: blankToNull(form.receiverRut),
      receiverAddress: blankToNull(form.receiverAddress),
      receiverCity: blankToNull(form.receiverCity),
      receiverPhone: blankToNull(form.receiverPhone),
      purchaseOrder: blankToNull(form.purchaseOrder),
      reference: blankToNull(form.reference),
      notes: blankToNull(form.notes),
      items: form.items.map((item) => ({
        productId: item.productId ?? null,
        code: blankToNull(item.code),
        description: item.description.trim(),
        quantity: Number(item.quantity),
      })),
    };
    try {
      const saved = remito ? await remitosService.update(remito.id, payload) : await remitosService.create(payload);
      showSnackbar(
        remito ? "Remito actualizado" : `Remito N.º ${formatRemitoNumber(saved.number)} creado`,
        "success",
      );
      onSaved(saved);
      onOpenChange(false);
    } catch (error) {
      handleActionError(error, "No se pudo guardar el remito");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{remito ? `Editar remito N.º ${formatRemitoNumber(remito.number)}` : "Nuevo remito"}</DialogTitle>
          <DialogDescription>
            {remito
              ? "Los cambios se reflejan en el PDF."
              : "El número se asigna automáticamente al guardar. Podés cargar los datos desde una licitación o un cliente."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <SearchPicker<Licitation>
            trigger={
              <>
                {loadingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gavel className="mr-2 h-4 w-4" />}
                Cargar desde licitación
              </>
            }
            placeholder="Buscar por número de llamado o cliente..."
            search={async (term) => (await licitacionesService.getAll({ search: term || undefined })).data}
            getKey={(l) => l.id}
            renderItem={(l) => (
              <div className="min-w-0">
                <div className="font-medium truncate">{l.callNumber}{l.internalNumber ? ` · ${l.internalNumber}` : ""}</div>
                <div className="text-xs text-muted-foreground truncate">{l.client?.name}</div>
              </div>
            )}
            onSelect={applyLicitation}
          />
          <SearchPicker<Cliente>
            trigger={<><User className="mr-2 h-4 w-4" />Elegir cliente</>}
            placeholder="Buscar cliente..."
            search={async (term) => (await clientesService.getAll({ search: term || undefined, limit: 20 })).data}
            getKey={(c) => c.id}
            renderItem={(c) => (
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground">RUT {c.identifier}</div>
              </div>
            )}
            onSelect={applyClient}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</p>
            <div className="space-y-1.5">
              <Label htmlFor="receiverName">Nombre *</Label>
              <Input id="receiverName" value={form.receiverName} onChange={(e) => set("receiverName", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="receiverRut">RUT</Label>
                <Input id="receiverRut" value={form.receiverRut ?? ""} onChange={(e) => set("receiverRut", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="receiverPhone">Teléfono</Label>
                <Input id="receiverPhone" value={form.receiverPhone ?? ""} onChange={(e) => set("receiverPhone", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-[2fr_1fr] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="receiverAddress">Dirección</Label>
                <Input id="receiverAddress" value={form.receiverAddress ?? ""} onChange={(e) => set("receiverAddress", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="receiverCity">Ciudad</Label>
                <Input id="receiverCity" value={form.receiverCity ?? ""} onChange={(e) => set("receiverCity", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datos de la entrega</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="purchaseOrder">Orden de compra</Label>
                <Input id="purchaseOrder" value={form.purchaseOrder ?? ""} onChange={(e) => set("purchaseOrder", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" value={form.date ?? ""} onChange={(e) => set("date", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference">Referencia</Label>
              <Input id="reference" placeholder="Ej. licitación o pedido" value={form.reference ?? ""} onChange={(e) => set("reference", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea id="notes" rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Mercadería entregada</p>
            <div className="flex gap-2">
              <SearchPicker<Product>
                trigger={<><Package className="mr-2 h-4 w-4" />Agregar producto</>}
                placeholder="Buscar por nombre o código..."
                search={async (term) => (await productsService.getAll({ search: term || undefined, limit: 20 })).data}
                getKey={(p) => p.id}
                renderItem={(p) => (
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{[p.code, p.brand, p.model].filter(Boolean).join(" · ")}</div>
                  </div>
                )}
                onSelect={addProduct}
                variant="secondary"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => set("items", [...form.items, { code: "", description: "", quantity: 1 }])}
              >
                <Plus className="mr-2 h-4 w-4" /> Línea manual
              </Button>
            </div>
          </div>

          {form.items.length === 0 ? (
            <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
              Agregá los productos que se entregan.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="hidden md:grid grid-cols-[28px_140px_1fr_96px_36px] gap-2 px-1 text-xs font-medium text-muted-foreground">
                <span>#</span><span>Código</span><span>Descripción</span><span>Cantidad</span><span />
              </div>
              {form.items.map((item, index) => (
                <div key={index} className="grid grid-cols-[28px_1fr_36px] md:grid-cols-[28px_140px_1fr_96px_36px] items-center gap-2">
                  <span className="text-sm text-muted-foreground text-center">{index + 1}</span>
                  <Input
                    aria-label={`Código ítem ${index + 1}`}
                    placeholder="Código"
                    value={item.code ?? ""}
                    onChange={(e) => setItem(index, { code: e.target.value })}
                    className="md:col-auto col-span-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-red-600"
                    aria-label={`Quitar ítem ${index + 1}`}
                    onClick={() => set("items", form.items.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Input
                    aria-label={`Descripción ítem ${index + 1}`}
                    placeholder="Descripción"
                    value={item.description}
                    onChange={(e) => setItem(index, { description: e.target.value })}
                    className="col-start-2 md:col-start-auto"
                  />
                  <Input
                    aria-label={`Cantidad ítem ${index + 1}`}
                    type="number"
                    min={0}
                    step="any"
                    value={Number.isFinite(item.quantity) ? item.quantity : ""}
                    onChange={(e) => setItem(index, { quantity: e.target.value === "" ? NaN : Number(e.target.value) })}
                    className="col-start-2 md:col-start-auto"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden md:inline-flex text-red-600"
                    aria-label={`Quitar ítem ${index + 1}`}
                    onClick={() => set("items", form.items.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={!canSave || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {remito ? "Guardar cambios" : "Crear remito"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
