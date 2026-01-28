import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuotationItemForm } from "@/components/quotations";
import { NewItemData } from "../../hooks/useQuotationActions";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: NewItemData;
  setData: React.Dispatch<React.SetStateAction<NewItemData>>;
  onSave: () => Promise<void>;
  submitting: boolean;
}

export const EditItemDialog = ({
  open,
  onOpenChange,
  data,
  setData,
  onSave,
  submitting,
}: EditItemDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Item de Cotización</DialogTitle>
        </DialogHeader>
        <QuotationItemForm
          data={data}
          onChange={setData}
          showOfferSearch={true}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={submitting}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
