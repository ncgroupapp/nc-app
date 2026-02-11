import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { Licitation } from "@/services/licitaciones.service";
import { Currency } from "@/types";
import { CreateQuotationData } from "../../hooks/useQuotationActions";

interface CreateQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licitation: Licitation | null;
  data: CreateQuotationData;
  setData: React.Dispatch<React.SetStateAction<CreateQuotationData>>;
  onConfirm: () => Promise<void>;
  submitting: boolean;
}

export const CreateQuotationDialog = ({
  open,
  onOpenChange,
  licitation,
  data,
  setData,
  onConfirm,
  submitting,
}: CreateQuotationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Cotización</DialogTitle>
          <DialogDescription>
            Configure los datos de la cotización antes de crearla. Podrá agregar y editar los items posteriormente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quotationIdentifier">Identificador de Cotización *</Label>
            <Input
              id="quotationIdentifier"
              value={data.quotationIdentifier}
              onChange={(e) => setData(prev => ({ ...prev, quotationIdentifier: e.target.value }))}
              placeholder="COT-2024-001"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                value={data.currency}
                onValueChange={(value) => setData(prev => ({ ...prev, currency: value as Currency }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Currency).map(currency => (
                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Forma de Pago</Label>
              <Input
                value={data.paymentForm}
                onChange={(e) => setData(prev => ({ ...prev, paymentForm: e.target.value }))}
                placeholder="30 días"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Validez de la Cotización</Label>
            <Input
              value={data.validity}
              onChange={(e) => setData(prev => ({ ...prev, validity: e.target.value }))}
              placeholder="15 días"
            />
          </div>
          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Input
              value={data.observations}
              onChange={(e) => setData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Observaciones generales de la cotización"
            />
          </div>
          {licitation?.licitationProducts && licitation.licitationProducts.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> Se crearán {licitation.licitationProducts.length} item(s) basados en los productos de la licitación. 
                Podrá editar precios y cantidades después de crear la cotización.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={submitting || !data.quotationIdentifier}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Crear Cotización
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
