import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Calculator, CheckCircle, Download, Edit, FileText, Loader2, Plus, XCircle, Package, Tag, Hash, DollarSign } from "lucide-react";
import { Quotation, QuotationItem } from "@/services/cotizaciones.service";
import { QuotationStatus, QuotationAwardStatus } from "@/types";
import { QuotationItemForm } from "@/components/quotations";
import { getStatusParams } from "../../utils/statusHelpers";
import { calcularTotales } from "../../utils/calculations";
import { NewItemData } from "../../hooks/useQuotationActions";

interface QuotationTabProps {
  quotation: Quotation | null;
  submitting: boolean;
  onOpenCreateQuotation: () => void;
  isQuotationDialogOpen: boolean;
  setIsQuotationDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newItemData: NewItemData;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemData>>;
  onAddItem: () => Promise<void>;
  onEditItem: (item: QuotationItem) => void;
  onStatusChange: (item: QuotationItem, status: QuotationAwardStatus) => void;
  onOpenAward: (item: QuotationItem) => void;
  onOpenReject: (item: QuotationItem) => void;
  onEditAwardedQuantity: (item: QuotationItem) => void;
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
  onEditAwardedQuantity,
  onFinalize,
  onDownloadPdf,
}: QuotationTabProps) => {
  if (!quotation) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No hay cotización creada</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Cree una cotización para comenzar a agregar precios y condiciones de venta para esta licitación.
            </p>
            <Button onClick={onOpenCreateQuotation} disabled={submitting} size="lg" className="rounded-full px-8">
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
    <div className="space-y-6">
      <Card className="border shadow-sm bg-card overflow-hidden">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Cotización: {quotation.quotationIdentifier}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                Estado: 
                <Badge variant="outline" className={quotation.status === QuotationStatus.FINALIZED 
                  ? "bg-green-50 text-green-700 border-green-200 font-bold" 
                  : "bg-blue-50 text-blue-700 border-blue-200 font-bold"}>
                  {quotation.status === QuotationStatus.FINALIZED ? 'Finalizada' : 'En Creación'}
                </Badge>
              </CardDescription>
            </div>
            {quotation.status !== QuotationStatus.FINALIZED && (
              <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Agregar Producto a Cotización</DialogTitle>
                    <DialogDescription>
                      Complete los detalles del producto para incluirlo en la oferta.
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
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="rounded-md border overflow-hidden bg-background">
                {quotation.items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
                    <p>No hay productos en esta cotización.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[200px]">Producto</TableHead>
                        <TableHead>Marca/Origen</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">P. Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotation.items.map((item, index) => {
                        const statusParams = getStatusParams(item.awardStatus);
                        
                        return (
                          <TableRow key={item.id || index} className="hover:bg-muted/30 transition-colors group">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{item.productName}</span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                  Entrega: {item.deliveryTime} días
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5 text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Tag className="h-3 w-3" />
                                  <span className="font-medium">{item.brand || '-'}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground italic pl-4.5">{item.origin || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-bold">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase">{item.currency}</span>
                                <span>${item.priceWithoutIVA.toLocaleString()}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-sm text-primary">
                              ${(item.priceWithIVA * item.quantity).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Select
                                  value={item.awardStatus}
                                  onValueChange={(val) => onStatusChange(item, val as QuotationAwardStatus)}
                                  disabled={quotation.status === QuotationStatus.FINALIZED}
                                >
                                  <SelectTrigger className="w-full h-7 text-[10px] px-2">
                                    <Badge variant="outline" className={`${statusParams.color} border-none p-0 h-auto font-bold`}>
                                      {statusParams.label}
                                    </Badge>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={QuotationAwardStatus.PENDING}>En Espera</SelectItem>
                                    <SelectItem value={QuotationAwardStatus.AWARDED}>Adjudicado</SelectItem>
                                    <SelectItem value={QuotationAwardStatus.PARTIALLY_AWARDED}>Adjudicación Parcial</SelectItem>
                                    <SelectItem value={QuotationAwardStatus.NOT_AWARDED}>No Adjudicada</SelectItem>
                                  </SelectContent>
                                </Select>
                                {item.awardStatus === QuotationAwardStatus.PARTIALLY_AWARDED && (
                                  <div className="flex items-center gap-1 pl-1">
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                      ({item.awardedQuantity}/{item.quantity})
                                    </span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-4 w-4 p-0"
                                      onClick={() => onEditAwardedQuantity(item)}
                                    >
                                      <Edit className="h-2.5 w-2.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-1">
                                {quotation.status !== QuotationStatus.FINALIZED ? (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onEditItem(item)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  item.awardStatus === QuotationAwardStatus.PENDING && (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10 border-green-500/20"
                                        onClick={() => onOpenAward(item)}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
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
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-muted/30 rounded-xl p-6 border border-muted-foreground/10 space-y-6 sticky top-0">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Calculator className="h-3.5 w-3.5" />
                  Resumen de Oferta
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">IVA</span>
                    <span>${iva.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-3 border-t border-muted-foreground/20">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Oferta</span>
                      <span className="text-2xl font-black text-primary">
                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button className="w-full rounded-full h-11 font-bold" variant="outline" onClick={onDownloadPdf}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </Button>
                  {quotation.status !== QuotationStatus.FINALIZED && (
                    <Button 
                      className="w-full rounded-full h-11 font-bold shadow-lg shadow-primary/20" 
                      onClick={onFinalize}
                      disabled={submitting || quotation.items.length === 0}
                    >
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Finalizar Cotización
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
