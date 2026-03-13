"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Package, Pencil, Plus, Truck, Upload } from "lucide-react";
import { LicitationStatus } from "@/services/licitaciones.service";
import {
  entregasService,
  Delivery,
  DeliveryItem,
  DeliveryItemStatus,
  DeliveryStatus,
  UpdateDeliveryItemDto,
} from "@/services/entregas.service";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { uploadInvoiceFile } from "@/lib/firebase";
import { showSnackbar } from "@/components/ui/snackbar";

interface DeliveryTabProps {
  licitationId: number;
  licitationStatus: LicitationStatus;
}

const statusLabels: Record<DeliveryItemStatus, string> = {
  [DeliveryItemStatus.PENDING]: "Pendiente",
  [DeliveryItemStatus.ON_WAY]: "En Camino",
  [DeliveryItemStatus.DELIVERED]: "Entregado",
  [DeliveryItemStatus.ISSUE]: "Problema",
};

const statusColors: Record<DeliveryItemStatus, string> = {
  [DeliveryItemStatus.PENDING]: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
  [DeliveryItemStatus.ON_WAY]: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  [DeliveryItemStatus.DELIVERED]: "bg-green-500/10 text-green-500 border border-green-500/20",
  [DeliveryItemStatus.ISSUE]: "bg-red-500/10 text-red-500 border border-red-500/20",
};

const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: "Pendiente",
  [DeliveryStatus.PARTIAL]: "Parcial",
  [DeliveryStatus.COMPLETED]: "Completado",
  [DeliveryStatus.ISSUE]: "Con Problemas",
};

const deliveryStatusColors: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  [DeliveryStatus.PARTIAL]: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  [DeliveryStatus.COMPLETED]: "bg-green-500/10 text-green-500 border-green-500/20",
  [DeliveryStatus.ISSUE]: "bg-red-500/10 text-red-500 border-red-500/20",
};

export const DeliveryTab = ({ licitationId, licitationStatus }: DeliveryTabProps) => {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  
  // Estado del diálogo de edición
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryItem | null>(null);
  const [editForm, setEditForm] = useState<UpdateDeliveryItemDto>({});

  // Estado del diálogo de factura
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const loadDelivery = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await entregasService.getByLicitation(licitationId);
      setDelivery(data);
    } catch (error) {
      console.error("Error loading delivery:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [licitationId]);

  useEffect(() => {
    loadDelivery();
  }, [loadDelivery]);

  const handleUploadInvoice = async () => {
    if (!delivery || !invoiceFile || !invoiceNumber || !invoiceDate) return;

    try {
      setIsUploadingInvoice(true);
      const fileUrl = await uploadInvoiceFile(invoiceFile);
      
      await entregasService.addInvoice(delivery.id, {
        invoiceNumber,
        issueDate: invoiceDate,
        fileName: invoiceFile.name,
        fileUrl,
      });

      await loadDelivery(true);
      showSnackbar("Factura subida exitosamente", "success");
      
      // Reset form
      setInvoiceDialogOpen(false);
      setInvoiceNumber("");
      setInvoiceDate("");
      setInvoiceFile(null);
    } catch (error) {
      console.error("Error uploading invoice:", error);
      showSnackbar("Error al subir la factura", "error");
    } finally {
      setIsUploadingInvoice(false);
    }
  };

  const handleStatusChange = async (item: DeliveryItem, newStatus: DeliveryItemStatus) => {
    if (!delivery) return;

    try {
      setUpdatingItemId(item.id);
      await entregasService.updateItemStatus(delivery.id, item.id, { status: newStatus });
      await loadDelivery(true);
    } catch (error) {
      console.error("Error updating item status:", error);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleOpenEditDialog = (item: DeliveryItem) => {
    setEditingItem(item);
    setEditForm({
      status: item.status,
      actualDate: item.actualDate ? item.actualDate.split('T')[0] : undefined,
      observations: item.observations || '',
      quantity: item.quantity,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!delivery || !editingItem) return;

    try {
      setUpdatingItemId(editingItem.id);
      await entregasService.updateItemStatus(delivery.id, editingItem.id, editForm);
      await loadDelivery(true);
      setEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating item:", error);
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span>Cargando entregas...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Entrega de Productos</span>
              </CardTitle>
              <CardDescription>
                Estado de entrega de los productos adjudicados
              </CardDescription>
            </div>
            {delivery && (
              <Badge variant="outline" className={deliveryStatusColors[delivery.calculatedStatus]}>
                {deliveryStatusLabels[delivery.calculatedStatus]}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!delivery || (delivery.items?.length ?? 0) === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay productos para entregar.</p>
              {licitationStatus === LicitationStatus.PENDING && (
                <p className="mt-2 text-sm">
                  Primero debe finalizar la cotización y registrar las adjudicaciones.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tabla de Items */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead>Fecha Estimada</TableHead>
                    <TableHead>Fecha Real</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delivery.items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-sm">
                        {item.productCode}
                      </TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell>
                        {new Date(item.estimatedDate).toLocaleDateString("es-UY")}
                      </TableCell>
                      <TableCell>
                        {item.actualDate 
                          ? new Date(item.actualDate).toLocaleDateString("es-UY")
                          : <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell>
                        {updatingItemId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Select
                            value={item.status}
                            onValueChange={(value) =>
                              handleStatusChange(item, value as DeliveryItemStatus)
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  <span className={`px-2 py-1 rounded flex w-fit items-center font-semibold text-xs ${statusColors[value as DeliveryItemStatus]}`}>
                                    {label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditDialog(item)}
                          title="Editar item"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Sección de Facturas */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Facturas
                  </h4>
                  <Button size="sm" onClick={() => setInvoiceDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Subir Factura
                  </Button>
                </div>
                {delivery.invoices && delivery.invoices.length > 0 ? (
                  <div className="space-y-2">
                    {delivery.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {new Date(invoice.issueDate).toLocaleDateString("es-UY")}
                          </span>
                        </div>
                        {invoice.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={invoice.fileUrl} target="_blank" rel="noopener noreferrer">
                              Ver PDF
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay facturas asociadas.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Item de Entrega</DialogTitle>
            <DialogDescription>
              {editingItem?.productName} - {editingItem?.productCode}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value as DeliveryItemStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={editForm.quantity || ''}
                onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || undefined })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="actualDate">Fecha Real de Entrega</Label>
              <DatePicker
                date={editForm.actualDate ? new Date(editForm.actualDate + "T12:00:00") : undefined}
                setDate={(date) => setEditForm({ ...editForm, actualDate: date ? format(date, "yyyy-MM-dd") : undefined })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                placeholder="Notas sobre la entrega..."
                value={editForm.observations || ''}
                onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updatingItemId !== null}>
              {updatingItemId !== null ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Factura */}
      <Dialog open={invoiceDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setInvoiceNumber("");
          setInvoiceDate("");
          setInvoiceFile(null);
        }
        setInvoiceDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Subir Factura</DialogTitle>
            <DialogDescription>
              Adjunte una factura relacionada a esta entrega.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invoiceNumber">Número de Factura *</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ej: A-001-123456"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoiceDate">Fecha de Emisión *</Label>
              <DatePicker
                date={invoiceDate ? new Date(invoiceDate + "T12:00:00") : undefined}
                setDate={(date) => setInvoiceDate(date ? format(date, "yyyy-MM-dd") : "")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoiceFile">Archivo (PDF/Imagen) *</Label>
              <Input
                id="invoiceFile"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)} disabled={isUploadingInvoice}>
              Cancelar
            </Button>
            <Button onClick={handleUploadInvoice} disabled={isUploadingInvoice || !invoiceFile || !invoiceNumber || !invoiceDate}>
              {isUploadingInvoice ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Factura
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};