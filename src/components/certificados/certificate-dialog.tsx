"use client";

import { useEffect, useState } from "react";
import { Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showSnackbar } from "@/components/ui/snackbar";
import { handleActionError } from "@/lib/error-handler";
import { Certificate, CertificateInput, certificatesService } from "@/services/certificates.service";

interface CertificateDialogProps {
  open: boolean;
  /** null creates a new certificate */
  certificate: Certificate | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY = { name: "", issuer: "", issueDate: "", expiryDate: "", alertDays: "30", notes: "", requiredForRupe: false };

/** Creates or renews a certificate: dates, how early to warn, notes and the scanned file. */
export function CertificateDialog({ open, certificate, onClose, onSaved }: CertificateDialogProps) {
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const builtIn = !!certificate?.code;

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setForm(
      certificate
        ? {
            name: certificate.name,
            issuer: certificate.issuer ?? "",
            issueDate: certificate.issueDate?.slice(0, 10) ?? "",
            expiryDate: certificate.expiryDate?.slice(0, 10) ?? "",
            alertDays: String(certificate.alertDays),
            notes: certificate.notes ?? "",
            requiredForRupe: certificate.requiredForRupe,
          }
        : EMPTY,
    );
  }, [open, certificate]);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.name.trim()) {
      showSnackbar("Poné el nombre del certificado", "error");
      return;
    }
    const alertDays = Number(form.alertDays);
    if (!Number.isInteger(alertDays) || alertDays < 1 || alertDays > 365) {
      showSnackbar("El aviso tiene que ser entre 1 y 365 días antes", "error");
      return;
    }
    if (form.issueDate && form.expiryDate && form.expiryDate < form.issueDate) {
      showSnackbar("El vencimiento no puede ser anterior a la emisión", "error");
      return;
    }
    const payload: CertificateInput = {
      name: form.name.trim(),
      issuer: form.issuer.trim() || null,
      issueDate: form.issueDate || null,
      expiryDate: form.expiryDate || null,
      alertDays,
      notes: form.notes.trim() || null,
      requiredForRupe: form.requiredForRupe,
    };
    setSaving(true);
    try {
      const saved = certificate
        ? await certificatesService.update(certificate.id, payload)
        : await certificatesService.create(payload);
      if (file) await certificatesService.uploadFile(saved.id, file);
      showSnackbar(certificate ? "Certificado actualizado" : "Certificado agregado", "success");
      onSaved();
      onClose();
    } catch (error) {
      handleActionError(error, "No se pudo guardar el certificado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{certificate ? (builtIn ? `Renovar ${certificate.name}` : "Editar certificado") : "Nuevo certificado"}</DialogTitle>
          <DialogDescription>
            {certificate?.description ?? "Cargá las fechas que figuran en el certificado y adjuntá el archivo."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cert-name">Nombre</Label>
            <Input id="cert-name" value={form.name} maxLength={150} disabled={builtIn} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cert-issuer">Organismo</Label>
            <Input id="cert-issuer" value={form.issuer} maxLength={100} disabled={builtIn} placeholder="DGI, BPS, MSP..." onChange={(e) => set("issuer", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cert-alert">Avisar días antes</Label>
            <Input id="cert-alert" type="number" min={1} max={365} value={form.alertDays} onChange={(e) => set("alertDays", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cert-issue">Fecha de emisión</Label>
            <Input id="cert-issue" type="date" value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cert-expiry">Vence el</Label>
            <Input id="cert-expiry" type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cert-file">{certificate?.fileName ? "Reemplazar archivo" : "Archivo del certificado"}</Label>
            <Input id="cert-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {certificate?.fileName && !file && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" aria-hidden="true" /> Actual: {certificate.fileName}
              </p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cert-notes">Notas</Label>
            <Textarea id="cert-notes" rows={2} value={form.notes} placeholder="Dónde se tramita, quién lo renueva..." onChange={(e) => set("notes", e.target.value)} />
          </div>
          {!builtIn && (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox checked={form.requiredForRupe} onCheckedChange={(value) => set("requiredForRupe", value === true)} />
              Lo pide RUPE / las licitaciones (avisar también si falta cargarlo)
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
