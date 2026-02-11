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
import { CompetitorData } from "../../hooks/useAdjudicationActions";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitorData: CompetitorData;
  setCompetitorData: React.Dispatch<React.SetStateAction<CompetitorData>>;
  onConfirm: () => Promise<void>;
  submitting: boolean;
}

export const RejectDialog = ({
  open,
  onOpenChange,
  competitorData,
  setCompetitorData,
  onConfirm,
  submitting,
}: RejectDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar Item</DialogTitle>
          <DialogDescription>
            Ingrese información de la competencia ganadora.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre del Ganador</Label>
            <Input 
              value={competitorData.winnerName}
              onChange={(e) => setCompetitorData(prev => ({ ...prev, winnerName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>RUT del Ganador</Label>
            <Input 
              value={competitorData.winnerRut}
              onChange={(e) => setCompetitorData(prev => ({ ...prev, winnerRut: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Precio Ganador</Label>
            <Input 
              type="number"
              value={competitorData.winnerPrice}
              onChange={(e) => setCompetitorData(prev => ({ ...prev, winnerPrice: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Notas / Motivo</Label>
            <Input 
              value={competitorData.notes}
              onChange={(e) => setCompetitorData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={submitting || !competitorData.winnerName}>Confirmar Rechazo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
