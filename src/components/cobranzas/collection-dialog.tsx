"use client";

import { useEffect, useMemo, useState } from "react";
import { Gavel, Loader2, Receipt, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSnackbar } from "@/components/ui/snackbar";
import { Textarea } from "@/components/ui/textarea";
import { ClientPicker, PickedClient } from "@/components/facturacion/client-picker";
import { SearchPicker } from "@/components/remitos/search-picker";
import { handleActionError } from "@/lib/error-handler";
import { cn } from "@/lib/utils";
import {
  Collection,
  CollectionInvoice,
  PURCHASE_VAT,
  ProfitPartner,
  collectionsService,
  money,
  percent,
  previewTotals,
  shortDate,
} from "@/services/collections.service";
import { licitacionesService, Licitation } from "@/services/licitaciones.service";
import { rentabilidadService } from "@/services/rentabilidad.service";

interface CollectionDialogProps {
  open: boolean;
  /** Collection being edited; null to register a new one */
  collection: Collection | null;
  partners: ProfitPartner[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const BANKS = ["BROU", "Itaú", "Santander", "Scotiabank", "BBVA", "HSBC", "Heritage", "Bandes"];
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
const num = (value: string) => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};
const fixed = (value: number) => (Math.round(value * 100) / 100).toFixed(2);

type LinkedLicitation = Collection["licitation"];

/** Register or edit a collection: the transfer, the invoices it pays, the cost of the goods and the VAT. */
export function CollectionDialog({ open, collection, partners, onOpenChange, onSaved }: CollectionDialogProps) {
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<PickedClient | null>(null);
  const [pending, setPending] = useState<CollectionInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [bank, setBank] = useState("");
  const [reference, setReference] = useState("");
  const [cost, setCost] = useState("");
  const [purchaseTax, setPurchaseTax] = useState("");
  const [taxTouched, setTaxTouched] = useState(false);
  const [notes, setNotes] = useState("");
  const [licitation, setLicitation] = useState<LinkedLicitation>(null);
  const [suggestedCost, setSuggestedCost] = useState<number | null>(null);

  // Reset the form every time it opens
  useEffect(() => {
    if (!open) return;
    setClient(collection?.clientId ? { id: collection.clientId, name: collection.clientName } : null);
    setSelected(new Set(collection?.invoices.map((i) => i.id) ?? []));
    setDate(collection?.date ?? today());
    setAmount(collection ? fixed(collection.amountReceived) : "");
    setAmountTouched(!!collection);
    setBank(collection?.bank ?? "");
    setReference(collection?.reference ?? "");
    setCost(collection ? fixed(collection.cost) : "");
    setPurchaseTax(collection ? fixed(collection.purchaseTax) : "");
    setTaxTouched(!!collection && Math.abs(collection.purchaseTax - collection.cost * PURCHASE_VAT) > 0.01);
    setNotes(collection?.notes ?? "");
    setLicitation(collection?.licitation ?? null);
    setSuggestedCost(null);
  }, [open, collection]);

  // Unpaid invoices of the chosen client (plus the ones this collection already pays)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingInvoices(true);
    collectionsService
      .pendingInvoices({ clientId: client?.id, collectionId: collection?.id })
      .then((rows) => !cancelled && setPending(rows))
      .catch((error) => handleActionError(error, "No se pudieron cargar las facturas"))
      .finally(() => !cancelled && setLoadingInvoices(false));
    return () => {
      cancelled = true;
    };
  }, [open, client?.id, collection?.id]);

  const chosen = useMemo(() => pending.filter((i) => selected.has(i.id)), [pending, selected]);
  const currency = chosen[0]?.currency ?? collection?.currency ?? "USD";
  const owner = chosen[0] ? chosen[0].clientId ?? chosen[0].clientName : null;
  const totals = previewTotals(chosen, num(cost), num(purchaseTax), num(amount), partners);

  // The amount received follows the invoices until it is typed by hand
  useEffect(() => {
    if (!amountTouched) setAmount(chosen.length ? fixed(totals.invoiced) : "");
  }, [chosen.length, totals.invoiced, amountTouched]);

  // Purchase VAT is 22 % of the cost until it is typed by hand
  useEffect(() => {
    if (!taxTouched) setPurchaseTax(cost ? fixed(num(cost) * PURCHASE_VAT) : "");
  }, [cost, taxTouched]);

  // Cost of the offers chosen in the linked licitation, as a suggestion
  useEffect(() => {
    if (!open || !licitation) {
      setSuggestedCost(null);
      return;
    }
    let cancelled = false;
    rentabilidadService
      .getReport({ search: licitation.callNumber })
      .then((report) => {
        const row = report.licitations.find((l) => l.id === licitation.id);
        if (!row || cancelled) return;
        const rate = report.settings.exchangeRate;
        const value = currency === "USD" ? row.costUsd : rate ? row.costUsd * rate : null;
        setSuggestedCost(value && value > 0 ? value : null);
      })
      .catch(() => !cancelled && setSuggestedCost(null));
    return () => {
      cancelled = true;
    };
  }, [open, licitation, currency]);

  const toggle = (invoice: CollectionInvoice) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(invoice.id)) next.delete(invoice.id);
      else next.add(invoice.id);
      return next;
    });

  const pickLicitation = (l: Licitation) =>
    setLicitation({ id: l.id, callNumber: l.callNumber, internalNumber: l.internalNumber ?? null });

  const save = async () => {
    if (!chosen.length) {
      showSnackbar("Elegí al menos una factura", "error");
      return;
    }
    if (!date) {
      showSnackbar("Poné la fecha de la transferencia", "error");
      return;
    }
    if (num(amount) <= 0) {
      showSnackbar("Poné el monto recibido", "error");
      return;
    }
    setSaving(true);
    try {
      const data = {
        date,
        amountReceived: Math.round(num(amount) * 100) / 100,
        bank: bank.trim() || null,
        reference: reference.trim() || null,
        cost: Math.round(num(cost) * 100) / 100,
        purchaseTax: Math.round(num(purchaseTax) * 100) / 100,
        licitationId: licitation?.id ?? null,
        notes: notes.trim() || null,
        invoiceIds: chosen.map((i) => i.id),
      };
      const saved = collection ? await collectionsService.update(collection.id, data) : await collectionsService.create(data);
      showSnackbar(`Cobranza ${saved.number} guardada`, "success");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      handleActionError(error, "No se pudo guardar la cobranza");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-x-hidden overflow-y-auto sm:max-w-[720px] [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle>{collection ? `Editar cobranza ${collection.number}` : "Registrar cobranza"}</DialogTitle>
          <DialogDescription>
            Elegí las facturas que paga la transferencia. Al guardar quedan como cobradas en Facturación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Client and invoices */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> Cliente
              </Label>
              <div className="flex items-center gap-2">
                {client && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#EAF3FB] px-2 py-0.5 text-xs font-medium text-brand-blue">
                    {client.name}
                    <button type="button" onClick={() => setClient(null)} className="rounded hover:bg-brand-blue/10" aria-label="Quitar cliente">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <ClientPicker
                  trigger={<span className="text-xs">{client ? "Cambiar" : "Filtrar por cliente"}</span>}
                  variant="secondary"
                  className="h-7 px-2"
                  onSelect={(c) => setClient(c)}
                />
              </div>
            </div>

            <Label className="flex items-center gap-1.5 pt-1">
              <Receipt className="h-3.5 w-3.5" aria-hidden="true" /> Facturas por cobrar
              {chosen.length > 0 && <span className="text-xs font-normal text-muted-foreground">· {chosen.length} elegidas</span>}
            </Label>
            <div className="max-h-56 overflow-y-auto rounded-lg border">
              {loadingInvoices ? (
                <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              ) : pending.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No hay facturas sin cobrar{client ? " de este cliente" : ""}.</p>
              ) : (
                pending.map((invoice) => {
                  const checked = selected.has(invoice.id);
                  const blocked =
                    !checked && chosen.length > 0 &&
                    (invoice.currency !== currency || (invoice.clientId ?? invoice.clientName) !== owner);
                  return (
                    <label
                      key={invoice.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-accent/60",
                        checked && "bg-sky-50/70 dark:bg-sky-950/30",
                        blocked && "cursor-not-allowed opacity-45 hover:bg-transparent",
                      )}
                      title={blocked ? "Solo facturas del mismo cliente y moneda" : undefined}
                    >
                      <Checkbox checked={checked} disabled={blocked} onCheckedChange={() => toggle(invoice)} />
                      <span className="w-20 shrink-0 font-semibold text-brand-navy dark:text-foreground">{invoice.label}</span>
                      <span className="w-20 shrink-0 text-muted-foreground">{shortDate(invoice.issueDate)}</span>
                      <span className="min-w-0 flex-1 truncate">{invoice.clientName}</span>
                      <span className="whitespace-nowrap font-medium tabular-nums">{invoice.currency} {money(invoice.total)}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Transfer */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="cb-date">Fecha</Label>
              <Input id="cb-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cb-amount">Monto recibido ({currency})</Label>
              <Input id="cb-amount" inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setAmountTouched(true); }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cb-bank">Banco</Label>
              <Input id="cb-bank" list="cb-banks" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Elegí o escribí" />
              <datalist id="cb-banks">{BANKS.map((b) => <option key={b} value={b} />)}</datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cb-ref">Referencia</Label>
              <Input id="cb-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° de operación" />
            </div>
          </div>

          {/* Cost */}
          <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="flex items-center gap-1.5">
                <Gavel className="h-3.5 w-3.5" aria-hidden="true" /> Licitación (opcional, para sugerir el costo)
              </Label>
              <div className="flex items-center gap-2">
                {licitation && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#EAF3FB] px-2 py-0.5 text-xs font-medium text-brand-blue">
                    {licitation.callNumber}
                    <button type="button" onClick={() => setLicitation(null)} className="rounded hover:bg-brand-blue/10" aria-label="Quitar licitación">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
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
            {suggestedCost !== null && (
              <button
                type="button"
                onClick={() => setCost(fixed(suggestedCost))}
                className="w-full rounded-lg border border-dashed border-brand-blue/40 bg-background px-3 py-2 text-left text-xs text-brand-blue hover:bg-accent"
              >
                Usar el costo de las ofertas elegidas en la licitación: <b>{currency} {money(suggestedCost)}</b>
              </button>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cb-cost">Costo de mercadería sin IVA ({currency})</Label>
                <Input id="cb-cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cb-ptax">IVA compras ({currency}) {!taxTouched && <span className="font-normal text-muted-foreground">· 22 % del costo</span>}</Label>
                <Input id="cb-ptax" inputMode="decimal" value={purchaseTax} onChange={(e) => { setPurchaseTax(e.target.value); setTaxTouched(true); }} placeholder="0,00" />
              </div>
            </div>
          </div>

          {/* Live result */}
          {chosen.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-3 text-sm">
                <Line label="Venta neta (sin IVA)" value={money(totals.net)} />
                <Line label="Costo de mercadería" value={`-${money(num(cost))}`} />
                <Line label="Ganancia" value={`${currency} ${money(totals.profit)}`} className="font-bold text-emerald-700" />
                <Line label="Margen · Markup" value={`${percent(totals.margin)} · ${percent(totals.markup)}`} />
                <Line label="IVA ventas / compras" value={`${money(totals.salesTax)} / ${money(num(purchaseTax))}`} />
                <Line label="IVA a pagar" value={money(totals.taxToPay)} className="font-bold text-amber-700" />
                {Math.abs(totals.difference) >= 0.01 && <Line label="Diferencia de cobro" value={money(totals.difference)} />}
              </div>
              <div className="rounded-xl border p-3 text-sm">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-blue">Reparto de la ganancia</p>
                <Line label="Total · 100 %" value={money(totals.profit)} className="font-bold" />
                {totals.partners.map((p) => (
                  <Line key={p.name} label={`${p.name} · ${p.share} %`} value={money(p.amount)} />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="cb-notes">Notas</Label>
            <Textarea id="cb-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-brand-navy text-white hover:bg-brand-navy/90">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {collection ? "Guardar cambios" : "Registrar cobranza"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Line({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between gap-3 border-b py-1 last:border-b-0", className)}>
      <span>{label}</span>
      <span className="whitespace-nowrap tabular-nums">{value}</span>
    </div>
  );
}
