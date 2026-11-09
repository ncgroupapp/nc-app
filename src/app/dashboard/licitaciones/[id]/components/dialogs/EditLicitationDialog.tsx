"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Pencil, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSnackbar } from "@/components/ui/snackbar";
import { TimePicker } from "@/components/ui/time-picker";
import { ClientPicker, PickedClient } from "@/components/facturacion/client-picker";
import { handleActionError } from "@/lib/error-handler";
import { Licitation, licitacionesService } from "@/services/licitaciones.service";

interface EditLicitationDialogProps {
  licitation: Licitation;
}

/** Joins a "yyyy-MM-dd" day and the hour of `time` into a local date. */
const joinDateTime = (day: string, time: Date | undefined) => {
  const date = new Date(`${day}T00:00:00`);
  if (time) date.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return date;
};

/** "Editar" button in the licitation header: purchase number, client and dates. */
export function EditLicitationDialog({ licitation }: EditLicitationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [callNumber, setCallNumber] = useState("");
  const [client, setClient] = useState<PickedClient | null>(null);
  const [startDay, setStartDay] = useState("");
  const [startTime, setStartTime] = useState<Date | undefined>();
  const [deadlineDay, setDeadlineDay] = useState("");
  const [deadlineTime, setDeadlineTime] = useState<Date | undefined>();

  // Start from the current data each time the dialog opens
  useEffect(() => {
    if (!open) return;
    const start = new Date(licitation.startDate);
    const deadline = new Date(licitation.deadlineDate);
    setCallNumber(licitation.callNumber ?? "");
    setClient(licitation.client ? { id: Number(licitation.client.id), name: licitation.client.name } : null);
    setStartDay(format(start, "yyyy-MM-dd"));
    setStartTime(start);
    setDeadlineDay(format(deadline, "yyyy-MM-dd"));
    setDeadlineTime(deadline);
  }, [open, licitation]);

  const handleSave = async () => {
    if (!callNumber.trim() || !client || !startDay || !deadlineDay) {
      showSnackbar("Completá el número, el cliente y las dos fechas", "error");
      return;
    }
    const start = joinDateTime(startDay, startTime);
    const deadline = joinDateTime(deadlineDay, deadlineTime);
    if (deadline <= start) {
      showSnackbar("La fecha límite tiene que ser posterior a la de inicio", "error");
      return;
    }
    try {
      setSaving(true);
      await licitacionesService.update(licitation.id, {
        callNumber: callNumber.trim(),
        clientId: client.id,
        startDate: start.toISOString(),
        deadlineDate: deadline.toISOString(),
      });
      showSnackbar("Licitación actualizada", "success");
      setOpen(false);
      router.refresh();
    } catch (error) {
      handleActionError(error, "No se pudo guardar la licitación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Editar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Editar licitación</DialogTitle>
            <DialogDescription>
              {licitation.internalNumber ? `N.º interno ${licitation.internalNumber}. ` : ""}
              Los productos se editan en la pestaña Productos Solicitados.
            </DialogDescription>
          </DialogHeader>

          <div className="min-w-0 space-y-4">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="edit-callNumber">Número de llamado *</Label>
              <Input id="edit-callNumber" value={callNumber} onChange={(e) => setCallNumber(e.target.value)} />
            </div>

            <div className="min-w-0 space-y-2">
              <Label>Cliente *</Label>
              <div className="flex items-center gap-2">
                <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border px-3 text-sm">
                  <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{client?.name ?? "Sin cliente"}</span>
                </div>
                <ClientPicker trigger={<span>Cambiar</span>} onSelect={setClient} />
              </div>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label>Fecha de inicio *</Label>
                <div className="flex gap-2">
                  <DatePicker
                    date={startDay ? new Date(`${startDay}T12:00:00`) : undefined}
                    setDate={(date) => setStartDay(date ? format(date, "yyyy-MM-dd") : "")}
                    className="min-w-0 flex-1"
                  />
                  <TimePicker date={startTime} setDate={setStartTime} placeholder="Hora" />
                </div>
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Fecha límite *</Label>
                <div className="flex gap-2">
                  <DatePicker
                    date={deadlineDay ? new Date(`${deadlineDay}T12:00:00`) : undefined}
                    setDate={(date) => setDeadlineDay(date ? format(date, "yyyy-MM-dd") : "")}
                    className="min-w-0 flex-1"
                  />
                  <TimePicker date={deadlineTime} setDate={setDeadlineTime} placeholder="Hora" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
