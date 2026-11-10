"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, Gavel, Loader2, Receipt, Truck, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSnackbar } from "@/components/ui/snackbar";
import { Textarea } from "@/components/ui/textarea";
import { ClientPicker, PickedClient } from "@/components/facturacion/client-picker";
import { SearchPicker } from "@/components/remitos/search-picker";
import { handleActionError } from "@/lib/error-handler";
import { billingService, BillingDocument, formatBillingNumber, formatMoney } from "@/services/billing.service";
import { licitacionesService, Licitation } from "@/services/licitaciones.service";
import { PurchaseOrder, PurchaseOrderInvoice, PurchaseOrderRemito, purchaseOrdersService } from "@/services/purchase-orders.service";
import { formatIsoDate, Remito, remitosService } from "@/services/remitos.service";

interface PurchaseOrderDialogProps {
  open: boolean;
  /** Order being edited; null to load a new one */
  order: PurchaseOrder | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

type LinkedLicitation = PurchaseOrder["licitation"];

/** Removable chip for a linked document */
function LinkChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#EAF3FB] px-2 py-0.5 text-xs font-medium text-brand-blue">
      {label}
      <button type="button" onClick={onRemove} className="rounded hover:bg-brand-blue/10" aria-label={`Quitar ${label}`}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/** Load or edit a purchase order: its PDF, data and the licitation, invoices and remitos it relates to. */
export function PurchaseOrderDialog({ open, order, onOpenChange, onSaved }: PurchaseOrderDialogProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [number, setNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [client, setClient] = useState<PickedClient | null>(null);
  const [currency, setCurrency] = useState<"UYU" | "USD">("UYU");
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [licitation, setLicitation] = useState<LinkedLicitation>(null);
  const [invoices, setInvoices] = useState<PurchaseOrderInvoice[]>([]);
  const [remitos, setRemitos] = useState<PurchaseOrderRemito[]>([]);
  const [reading, setReading] = useState(false);
  const [readNote, setReadNote] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setReadNote(null);
    setNumber(order?.number ?? "");
    setIssueDate(order?.issueDate ?? "");
    setClient(order?.clientId ? { id: order.clientId, name: order.clientName ?? "" } : null);
    setCurrency(order?.currency ?? "UYU");
    setTotal(order?.total !== null && order?.total !== undefined ? String(order.total) : "");
    setNotes(order?.notes ?? "");
    setLicitation(order?.licitation ?? null);
    setInvoices(order?.invoices ?? []);
    setRemitos(order?.remitos ?? []);
  }, [open, order]);

  /** Reads the chosen PDF and fills in only the fields that are still empty */
  const chooseFile = async (chosen: File | null) => {
    setFile(chosen);
    setReadNote(null);
    if (!chosen) return;
    try {
      setReading(true);
      const read = await purchaseOrdersService.read(chosen);
      if (!read.readable) {
        setReadNote({ tone: "warn", text: "Es un PDF escaneado (sin texto): completá los datos a mano." });
        return;
      }
      if (read.number) setNumber((current) => current || read.number!);
      if (read.issueDate) setIssueDate((current) => current || read.issueDate!);
      if (read.client) setClient((current) => current ?? read.client);
      if (read.currency) setCurrency(read.currency);
      if (read.total !== null) setTotal((current) => current || String(read.total).replace(".", ","));
      if (read.licitation) setLicitation((current) => current ?? read.licitation);

      const found = [read.number, read.issueDate && "fecha", read.client ? "cliente" : read.clientName, read.total !== null && "total", read.licitation && "licitación"]
        .filter(Boolean).length;
      const missing = [
        !read.client && (read.clientName ? `el cliente "${read.clientName}" no está cargado en la app` : "no encontré el cliente"),
        !read.licitation && read.purchaseNumber && `no hay licitación ${read.purchaseNumber}`,
      ].filter(Boolean);
      setReadNote(
        read.existingOrderId
          ? { tone: "warn", text: `Ojo: la orden ${read.number} ya está cargada.` }
          : { tone: missing.length ? "warn" : "ok", text: `Leí ${found} datos del PDF. Revisalos antes de guardar.${missing.length ? ` (${missing.join("; ")})` : ""}` },
      );
    } catch {
      setReadNote({ tone: "warn", text: "No se pudo leer el PDF: completá los datos a mano." });
    } finally {
      setReading(false);
    }
  };

  const pickLicitation = (picked: Licitation) => {
    setLicitation({ id: picked.id, callNumber: picked.callNumber, internalNumber: picked.internalNumber ?? null });
    // The client usually is the licitation's
    if (!client && picked.client) setClient({ id: Number(picked.client.id), name: picked.client.name });
  };

  const handleSave = async () => {
    if (!number.trim()) {
      showSnackbar("Poné el número de la orden", "error");
      return;
    }
    if (!order && !file) {
      showSnackbar("Adjuntá el PDF de la orden", "error");
      return;
    }
    const amount = total.trim() ? Number(total.replace(/\./g, "").replace(",", ".")) : null;
    if (amount !== null && (Number.isNaN(amount) || amount < 0)) {
      showSnackbar("El total no es un número válido", "error");
      return;
    }
    try {
      setSaving(true);
      const data = {
        number: number.trim(),
        issueDate: issueDate || null,
        clientId: client?.id ?? null,
        licitationId: licitation?.id ?? null,
        currency,
        total: amount,
        notes: notes.trim() || null,
        invoiceIds: invoices.map((i) => i.id),
        remitoIds: remitos.map((r) => r.id),
      };
      const saved = order ? await purchaseOrdersService.update(order.id, data) : await purchaseOrdersService.create(data);
      if (file) await purchaseOrdersService.uploadFile(saved.id, file);
      showSnackbar(order ? "Orden de compra actualizada" : "Orden de compra cargada", "success");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      handleActionError(error, "No se pudo guardar la orden de compra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{order ? `Editar orden ${order.number}` : "Nueva orden de compra"}</DialogTitle>
          <DialogDescription>Licitación, facturas y remitos son opcionales: vinculalos cuando los tengas.</DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <Label>Archivo de la orden (PDF) {!order && "*"}</Label>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={reading}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground hover:bg-muted/50"
            >
              {reading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileUp className="h-4 w-4" aria-hidden="true" />}
              {reading
                ? "Leyendo la orden..."
                : file
                  ? file.name
                  : order?.fileName
                    ? `${order.fileName} · tocá para reemplazarlo`
                    : "Tocá para elegir el PDF: la app lee los datos sola"}
            </button>
            {readNote && (
              <p
                className={`rounded-md px-3 py-2 text-xs ${readNote.tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
                role="status"
              >
                {readNote.text}
              </p>
            )}
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="po-number">N.º de orden *</Label>
              <Input id="po-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Ej: OC 2026-1184" />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="po-date">Fecha</Label>
              <Input id="po-date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <div className="flex items-center gap-2">
              <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border px-3 text-sm">
                <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{client?.name || "Sin cliente"}</span>
              </div>
              <ClientPicker trigger={<span>{client ? "Cambiar" : "Elegir"}</span>} onSelect={setClient} />
            </div>
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={(value) => setCurrency(value as "UYU" | "USD")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UYU">Pesos</SelectItem>
                  <SelectItem value="USD">Dólares</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="po-total">Total</Label>
              <Input id="po-total" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Ej: 54200" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Gavel className="h-3.5 w-3.5" aria-hidden="true" /> Licitación</Label>
            <div className="flex flex-wrap items-center gap-2">
              {licitation && (
                <LinkChip
                  label={`${licitation.callNumber}${licitation.internalNumber ? ` · ${licitation.internalNumber}` : ""}`}
                  onRemove={() => setLicitation(null)}
                />
              )}
              <SearchPicker<Licitation>
                trigger={<span className="text-xs">{licitation ? "Cambiar" : "+ Vincular licitación"}</span>}
                variant="secondary"
                className="h-7 px-2"
                placeholder="Buscar por número de llamado o cliente..."
                search={async (term) => (await licitacionesService.getAll({ search: term || undefined })).data}
                getKey={(l) => l.id}
                renderItem={(l) => (
                  <div className="min-w-0">
                    <div className="truncate font-medium">{l.callNumber}</div>
                    <div className="truncate text-xs text-muted-foreground">{[l.internalNumber, l.client?.name].filter(Boolean).join(" · ")}</div>
                  </div>
                )}
                onSelect={pickLicitation}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" aria-hidden="true" /> Facturas</Label>
            <div className="flex flex-wrap items-center gap-2">
              {invoices.map((invoice) => (
                <LinkChip
                  key={invoice.id}
                  label={`${formatBillingNumber(invoice)} · ${formatMoney(invoice.total, invoice.currency)}`}
                  onRemove={() => setInvoices((list) => list.filter((i) => i.id !== invoice.id))}
                />
              ))}
              <SearchPicker<BillingDocument>
                trigger={<span className="text-xs">+ Vincular factura</span>}
                variant="secondary"
                className="h-7 px-2"
                placeholder="Buscar por número o cliente..."
                search={async (term) =>
                  (await billingService.getAll({ search: term || undefined, type: "factura", limit: 20 })).data.filter(
                    (doc) => !invoices.some((i) => i.id === doc.id),
                  )
                }
                getKey={(doc) => doc.id}
                renderItem={(doc) => (
                  <div className="min-w-0">
                    <div className="truncate font-medium">{formatBillingNumber(doc)} · {formatMoney(doc.total, doc.currency)}</div>
                    <div className="truncate text-xs text-muted-foreground">{formatIsoDate(doc.issueDate)} · {doc.client?.name ?? doc.clientName ?? "-"}</div>
                  </div>
                )}
                onSelect={(doc) =>
                  setInvoices((list) => [
                    ...list,
                    { id: doc.id, type: doc.type, series: doc.series, number: doc.number, issueDate: doc.issueDate, currency: doc.currency, total: doc.total },
                  ])
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" aria-hidden="true" /> Remitos</Label>
            <div className="flex flex-wrap items-center gap-2">
              {remitos.map((remito) => (
                <LinkChip
                  key={remito.id}
                  label={`Remito ${remito.number}`}
                  onRemove={() => setRemitos((list) => list.filter((r) => r.id !== remito.id))}
                />
              ))}
              <SearchPicker<Remito>
                trigger={<span className="text-xs">+ Vincular remito</span>}
                variant="secondary"
                className="h-7 px-2"
                placeholder="Buscar por número o destinatario..."
                search={async (term) =>
                  (await remitosService.getAll({ search: term || undefined })).filter((r) => !remitos.some((x) => x.id === r.id)).slice(0, 30)
                }
                getKey={(r) => r.id}
                renderItem={(r) => (
                  <div className="min-w-0">
                    <div className="truncate font-medium">Remito {r.number}</div>
                    <div className="truncate text-xs text-muted-foreground">{formatIsoDate(r.date)} · {r.receiverName}{r.purchaseOrder ? ` · OC ${r.purchaseOrder}` : ""}</div>
                  </div>
                )}
                onSelect={(r) => setRemitos((list) => [...list, { id: r.id, number: r.number, date: r.date, status: r.status }])}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="po-notes">Notas</Label>
            <Textarea id="po-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Guardar orden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
