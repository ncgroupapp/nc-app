import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { QuotationItem } from "@/services/cotizaciones.service";

interface AwardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: QuotationItem | null;
  awardQuantity: number;
  setAwardQuantity: React.Dispatch<React.SetStateAction<number>>;
  isFullAward: boolean;
  onConfirm: () => Promise<void>;
  submitting: boolean;
}

export const AwardDialog = ({
  open,
  onOpenChange,
  item,
  awardQuantity,
  setAwardQuantity,
  isFullAward,
  onConfirm,
  submitting,
}: AwardDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isFullAward ? "Confirmar Adjudicación Total" : "Adjudicar Item Parcialmente"}</DialogTitle>
          <DialogDescription>
            {isFullAward 
              ? "Confirme que desea adjudicar la cantidad total de este ítem."
              : "Ingrese la cantidad a adjudicar."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cantidad a Adjudicar (Máx: {item?.quantity})</Label>
            <Input 
              type="number" 
              max={item?.quantity}
              min={1}
              value={awardQuantity}
              disabled={isFullAward}
              onChange={(e) => setAwardQuantity(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={submitting}>
            {isFullAward ? "Confirmar Total" : "Confirmar Adjudicación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
