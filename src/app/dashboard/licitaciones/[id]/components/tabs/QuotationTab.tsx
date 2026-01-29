import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Plus,
  Calculator,
  Loader2,
  Download,
  Edit,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { Quotation, QuotationItem } from "@/services/cotizaciones.service";
import { QuotationStatus, QuotationAwardStatus } from "@/types";
import { QuotationItemForm } from "@/components/quotations";
import { getStatusParams } from "../../utils/statusHelpers";
import { calcularTotales } from "../../utils/calculations";
import { NewItemData } from "../../hooks/useQuotationActions";

interface QuotationTabProps {
  quotation: Quotation | null;
  submitting: boolean;
  // Create quotation
  onOpenCreateQuotation: () => void;
  // Add item dialog
  isQuotationDialogOpen: boolean;
  setIsQuotationDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newItemData: NewItemData;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemData>>;
  onAddItem: () => Promise<void>;
  // Edit item
  onEditItem: (item: QuotationItem) => void;
  // Status change (award/reject)
  onStatusChange: (item: QuotationItem, status: QuotationAwardStatus) => void;
  onOpenAward: (item: QuotationItem) => void;
  onOpenReject: (item: QuotationItem) => void;
  // Finalize and PDF
  onFinalize: () => Promise<void>;
  onDownloadPdf: () => Promise<void>;
}

export const QuotationTab = ({
  quotation,
  submitting,
  onOpenCreateQuotation,
  isQuotationDialogOpen,
  setIsQuotationDialogOpen,
  newItemData,
  setNewItemData,
  onAddItem,
  onEditItem,
  onStatusChange,
  onOpenAward,
  onOpenReject,
  onFinalize,
  onDownloadPdf,
}: QuotationTabProps) => {
  if (!quotation) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay cotización creada</h3>
            <p className="text-gray-500 mb-4">
              Cree una cotización para comenzar a agregar precios y condiciones
            </p>
            <Button onClick={onOpenCreateQuotation} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Crear Cotización
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { subtotal, iva, total } = calcularTotales(quotation.items);

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Cotización: {quotation.quotationIdentifier}</h3>
          <p className="text-muted-foreground">
            Estado: <Badge variant={quotation.status === QuotationStatus.FINALIZED ? "default" : "secondary"}>
              {quotation.status === QuotationStatus.FINALIZED ? 'Finalizada' : 'En Creación'}
            </Badge>
          </p>
        </div>
        {quotation.status !== QuotationStatus.FINALIZED && (
          <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Agregar Producto a Cotización</DialogTitle>
                <DialogDescription>
                  Complete los detalles del producto
                </DialogDescription>
              </DialogHeader>
              <QuotationItemForm
                data={newItemData}
                onChange={setNewItemData}
                showOfferSearch={true}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsQuotationDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={onAddItem} disabled={submitting || !newItemData.productName}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Agregar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Productos de la Cotización</CardTitle>
            </CardHeader>
            <CardContent>
              {quotation.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay productos en esta cotización
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unit.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotation.items.map((item, index) => {
                      const statusParams = getStatusParams(item.awardStatus);
                      
                      return (
                        <TableRow key={item.id || index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-sm text-gray-500">
                                {item.deliveryTime} días - {item.currency}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.brand || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{item.origin || '-'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {item.priceWithoutIVA.toLocaleString()} {item.currency}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {(item.priceWithIVA * item.quantity).toLocaleString()} {item.currency}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Select
                                value={item.awardStatus}
                                onValueChange={(val) => onStatusChange(item, val as QuotationAwardStatus)}
                                disabled={quotation.status === QuotationStatus.FINALIZED}
                              >
                                <SelectTrigger className="w-[180px] h-8">
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${statusParams.color} border-none`}>
                                      {statusParams.label}
                                    </Badge>
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={QuotationAwardStatus.PENDING}>En Espera</SelectItem>
                                  <SelectItem value={QuotationAwardStatus.AWARDED}>Adjudicado</SelectItem>
                                  <SelectItem value={QuotationAwardStatus.PARTIALLY_AWARDED}>Adjudicación Parcial</SelectItem>
                                  <SelectItem value={QuotationAwardStatus.NOT_AWARDED}>No Adjudicada</SelectItem>
                                </SelectContent>
                              </Select>
                              {item.awardStatus === QuotationAwardStatus.PARTIALLY_AWARDED && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({item.awardedQuantity}/{item.quantity})
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {quotation.status !== QuotationStatus.FINALIZED ? (
                                <Button variant="ghost" size="sm" onClick={() => onEditItem(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              ) : (
                                item.awardStatus === QuotationAwardStatus.PENDING && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => onOpenAward(item)}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => onOpenReject(item)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA:</span>
                <span>${iva.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <Button className="w-full" variant="outline" onClick={onDownloadPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
                {quotation.status !== QuotationStatus.FINALIZED && (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={onFinalize}
                      disabled={submitting || quotation.items.length === 0}
                    >
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                      Finalizar Cotización
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
