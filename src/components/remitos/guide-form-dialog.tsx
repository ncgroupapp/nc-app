"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, User } from "lucide-react";
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
import { showSnackbar } from "@/components/ui/snackbar";
import { SearchPicker } from "@/components/remitos/search-picker";
import { handleActionError } from "@/lib/error-handler";
import { clientesService } from "@/services/clientes.service";
import { Remito, ShippingGuide, ShippingGuideInput, formatRemitoNumber, remitosService } from "@/services/remitos.service";
import { Cliente } from "@/types/cliente";

interface GuideFormDialogProps {
  open: boolean;
  /** Guide to edit; null creates a new one. */
  guide: ShippingGuide | null;
  /** Prefills a new guide from this remito. */
  fromRemito?: Remito | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (guide: ShippingGuide) => void;
}

const SENDER = { senderName: "NC GROUP SAS", senderPhone: "095604331", senderRut: "190323070010" };

const emptyForm = (): ShippingGuideInput => ({
  recipientName: "",
  recipientPhone: "",
  addressLines: ["", "", ""],
  ...SENDER,
  clientId: null,
  remitoId: null,
});

const padLines = (lines: string[]) => [...lines, "", "", ""].slice(0, 3);

export function GuideFormDialog({ open, guide, fromRemito, onOpenChange, onSaved }: GuideFormDialogProps) {
  const [form, setForm] = useState<ShippingGuideInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fillFromRemito = (remito: Remito) =>
    setForm((prev) => ({
      ...prev,
      remitoId: remito.id,
      clientId: remito.clientId ?? null,
      recipientName: remito.receiverName,
      recipientPhone: remito.receiverPhone ?? "",
      addressLines: padLines([remito.receiverAddress ?? "", remito.receiverCity ?? ""].filter(Boolean)),
    }));

  useEffect(() => {
    if (!open) return;
    if (guide) {
      setForm({ ...emptyForm(), ...guide, addressLines: padLines(guide.addressLines ?? []) });
    } else {
      setForm(emptyForm());
      if (fromRemito) fillFromRemito(fromRemito);
    }
  }, [open, guide, fromRemito]);

  const set = <K extends keyof ShippingGuideInput>(key: K, value: ShippingGuideInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setLine = (index: number, value: string) =>
    setForm((prev) => ({ ...prev, addressLines: prev.addressLines.map((line, i) => (i === index ? value : line)) }));

  const applyClient = (client: Cliente) => {
    const contact = client.contacts?.find((c) => c.address) ?? client.contacts?.[0];
    setForm((prev) => ({
      ...prev,
      clientId: Number(client.id),
      recipientName: client.name,
      recipientPhone: contact?.phone ?? prev.recipientPhone,
      addressLines: contact?.address ? padLines([contact.address]) : prev.addressLines,
    }));
  };

  const save = async () => {
    if (!form.recipientName.trim()) return;
    setSaving(true);
    const payload: ShippingGuideInput = {
      ...form,
      recipientName: form.recipientName.trim(),
      recipientPhone: form.recipientPhone?.trim() || null,
      addressLines: form.addressLines.map((line) => line.trim()).filter(Boolean),
      senderName: form.senderName?.trim() || SENDER.senderName,
      senderPhone: form.senderPhone?.trim() || null,
      senderRut: form.senderRut?.trim() || null,
    };
    try {
      const saved = guide ? await remitosService.updateGuide(guide.id, payload) : await remitosService.createGuide(payload);
      showSnackbar(guide ? "Guía actualizada" : "Guía de envío creada", "success");
      onSaved(saved);
      onOpenChange(false);
    } catch (error) {
      handleActionError(error, "No se pudo guardar la guía");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{guide ? "Editar guía de envío" : "Nueva guía de envío"}</DialogTitle>
          <DialogDescription>Etiqueta &quot;Datos de envío&quot; para pegar en el paquete. Se imprimen dos por hoja.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
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
          <SearchPicker<Remito>
            trigger={<><FileText className="mr-2 h-4 w-4" />Desde un remito</>}
            placeholder="Buscar remito por número o cliente..."
            search={async (term) => (await remitosService.getAll({ search: term || undefined })).slice(0, 30)}
            getKey={(r) => r.id}
            renderItem={(r) => (
              <div className="min-w-0">
                <div className="font-medium truncate">N.º {formatRemitoNumber(r.number)} · {r.receiverName}</div>
                <div className="text-xs text-muted-foreground truncate">{r.receiverAddress || "Sin dirección"}</div>
              </div>
            )}
            onSelect={fillFromRemito}
          />
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destinatario</p>
          <div className="space-y-1.5">
            <Label htmlFor="recipientName">Nombre *</Label>
            <Input id="recipientName" value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recipientPhone">Teléfono</Label>
            <Input id="recipientPhone" value={form.recipientPhone ?? ""} onChange={(e) => set("recipientPhone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addressLine0">Dirección (hasta 3 líneas)</Label>
            {form.addressLines.map((line, index) => (
              <Input
                key={index}
                id={`addressLine${index}`}
                aria-label={`Dirección línea ${index + 1}`}
                placeholder={["Ej. RETIRA EN AGENCIA DAC", "Ej. DEPARTAMENTO SALTO", ""][index]}
                value={line}
                onChange={(e) => setLine(index, e.target.value)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remitente</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="senderName">Nombre</Label>
              <Input id="senderName" value={form.senderName ?? ""} onChange={(e) => set("senderName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senderPhone">Teléfono</Label>
              <Input id="senderPhone" value={form.senderPhone ?? ""} onChange={(e) => set("senderPhone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senderRut">RUT</Label>
              <Input id="senderRut" value={form.senderRut ?? ""} onChange={(e) => set("senderRut", e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={!form.recipientName.trim() || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {guide ? "Guardar cambios" : "Crear guía"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
