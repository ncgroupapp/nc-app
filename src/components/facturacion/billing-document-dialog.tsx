"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSnackbar } from "@/components/ui/snackbar";
import { handleActionError } from "@/lib/error-handler";
import {
  BILLING_TYPE_LABELS,
  BillingDocument,
  BillingDocumentInput,
  BillingDocumentType,
  billingService,
} from "@/services/billing.service";

interface BillingDocumentDialogProps {
  document: BillingDocument | null;
  onClose: () => void;
  onSaved: () => void;
}

type FormState = Record<
  "series" | "number" | "issueDate" | "clientName" | "clientRut" | "subtotal" | "tax" | "total" | "referenceNumber",
  string
> & { type: BillingDocumentType; currency: string };

const toForm = (doc: BillingDocument): FormState => ({
  type: doc.type,
  series: doc.series ?? "",
  number: doc.number ?? "",
  issueDate: doc.issueDate?.slice(0, 10) ?? "",
  clientName: doc.clientName ?? "",
  clientRut: doc.clientRut ?? "",
  currency: doc.currency ?? "none",
  subtotal: doc.subtotal?.toString() ?? "",
  tax: doc.tax?.toString() ?? "",
  total: doc.total?.toString() ?? "",
  referenceNumber: doc.referenceNumber ?? "",
});

const text = (value: string) => value.trim() || null;
const amount = (value: string) => (value.trim() === "" ? null : Number(value.replace(",", ".")));

/** Fixes the data read from an invoice / credit note file (number, date, client, totals). */
export function BillingDocumentDialog({ document, onClose, onSaved }: BillingDocumentDialogProps) {
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(document ? toForm(document) : null);
  }, [document]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    if (!document || !form) return;
    const amounts = [form.subtotal, form.tax, form.total].map(amount);
    if (amounts.some((value) => value !== null && Number.isNaN(value))) {
      showSnackbar("Revisá los importes: tienen que ser números", "error");
      return;
    }
    const payload: BillingDocumentInput = {
      type: form.type,
      series: text(form.series)?.toUpperCase() ?? null,
      number: text(form.number)?.replace(/^0+(?=\d)/, "") ?? null,
      issueDate: text(form.issueDate),
      clientName: text(form.clientName),
      clientRut: text(form.clientRut),
      currency: form.currency === "none" ? null : form.currency,
      subtotal: amounts[0],
      tax: amounts[1],
      total: amounts[2],
      referenceNumber: text(form.referenceNumber),
    };
    setSaving(true);
    try {
      await billingService.update(document.id, payload);
      showSnackbar("Documento actualizado", "success");
      onSaved();
      onClose();
    } catch (error) {
      handleActionError(error, "No se pudo guardar el documento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!document} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar datos del documento</DialogTitle>
          <DialogDescription className="truncate">{document?.fileName}</DialogDescription>
        </DialogHeader>

        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(value) => set("type", value as BillingDocumentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(BILLING_TYPE_LABELS) as BillingDocumentType[]).map((type) => (
                    <SelectItem key={type} value={type}>{BILLING_TYPE_LABELS[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[5rem_1fr] gap-2">
              <div className="space-y-2">
                <Label htmlFor="billing-series">Serie</Label>
                <Input id="billing-series" value={form.series} maxLength={10} onChange={(e) => set("series", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-number">Número</Label>
                <Input id="billing-number" value={form.number} maxLength={30} onChange={(e) => set("number", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-date">Fecha de emisión</Label>
              <Input id="billing-date" type="date" value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={form.currency} onValueChange={(value) => set("currency", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin dato</SelectItem>
                  <SelectItem value="UYU">Pesos (UYU)</SelectItem>
                  <SelectItem value="USD">Dólares (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-client">Cliente</Label>
              <Input id="billing-client" value={form.clientName} maxLength={255} onChange={(e) => set("clientName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-rut">RUT del cliente</Label>
              <Input id="billing-rut" value={form.clientRut} maxLength={20} onChange={(e) => set("clientRut", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="billing-subtotal">Subtotal</Label>
                <Input id="billing-subtotal" inputMode="decimal" value={form.subtotal} onChange={(e) => set("subtotal", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-tax">IVA</Label>
                <Input id="billing-tax" inputMode="decimal" value={form.tax} onChange={(e) => set("tax", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-total">Total</Label>
                <Input id="billing-total" inputMode="decimal" value={form.total} onChange={(e) => set("total", e.target.value)} />
              </div>
            </div>
            {form.type === "nota_credito" && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="billing-reference">Factura a la que corresponde</Label>
                <Input
                  id="billing-reference"
                  placeholder="Ej: A-1234"
                  value={form.referenceNumber}
                  maxLength={50}
                  onChange={(e) => set("referenceNumber", e.target.value)}
                />
              </div>
            )}
          </div>
        )}

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
