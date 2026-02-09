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
import { Truck, Package, FileText, Loader2, Pencil } from "lucide-react";
import { LicitationStatus } from "@/services/licitaciones.service";
import {
  entregasService,
  Delivery,
  DeliveryItem,
  DeliveryItemStatus,
  DeliveryStatus,
  UpdateDeliveryItemDto,
} from "@/services/entregas.service";

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
  [DeliveryItemStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [DeliveryItemStatus.ON_WAY]: "bg-blue-100 text-blue-800",
  [DeliveryItemStatus.DELIVERED]: "bg-green-100 text-green-800",
  [DeliveryItemStatus.ISSUE]: "bg-red-100 text-red-800",
};

const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: "Pendiente",
  [DeliveryStatus.PARTIAL]: "Parcial",
  [DeliveryStatus.COMPLETED]: "Completado",
  [DeliveryStatus.ISSUE]: "Con Problemas",
};

const deliveryStatusColors: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [DeliveryStatus.PARTIAL]: "bg-blue-100 text-blue-800",
  [DeliveryStatus.COMPLETED]: "bg-green-100 text-green-800",
  [DeliveryStatus.ISSUE]: "bg-red-100 text-red-800",
};

export const DeliveryTab = ({ licitationId, licitationStatus }: DeliveryTabProps) => {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  
  // Estado del diálogo de edición
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryItem | null>(null);
  const [editForm, setEditForm] = useState<UpdateDeliveryItemDto>({});

  const loadDelivery = useCallback(async () => {
    try {
      setLoading(true);
      const data = await entregasService.getByLicitation(licitationId);
      setDelivery(data);
    } catch (error) {
      console.error("Error loading delivery:", error);
    } finally {
      setLoading(false);
    }
  }, [licitationId]);

  useEffect(() => {
    loadDelivery();
  }, [loadDelivery]);

  const handleStatusChange = async (item: DeliveryItem, newStatus: DeliveryItemStatus) => {
    if (!delivery) return;

    try {
      setUpdatingItemId(item.id);
      await entregasService.updateItemStatus(delivery.id, item.id, { status: newStatus });
      await loadDelivery();
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
      await loadDelivery();
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
              <Badge className={deliveryStatusColors[delivery.calculatedStatus]}>
                {deliveryStatusLabels[delivery.calculatedStatus]}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!delivery || (delivery.items?.length ?? 0) === 0 ? (
            <div className="text-center py-8 text-gray-500">
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
                    <TableRow key={item.id}>
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
                          : <span className="text-gray-400">-</span>
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
                                  <span className={`px-2 py-1 rounded text-xs ${statusColors[value as DeliveryItemStatus]}`}>
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
                <h4 className="font-medium flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4" />
                  Facturas
                </h4>
                {delivery.invoices && delivery.invoices.length > 0 ? (
                  <div className="space-y-2">
                    {delivery.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                          <span className="text-sm text-gray-500 ml-2">
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
                  <p className="text-sm text-gray-500">No hay facturas asociadas.</p>
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
              <Input
                id="actualDate"
                type="date"
                value={editForm.actualDate || ''}
                onChange={(e) => setEditForm({ ...editForm, actualDate: e.target.value || undefined })}
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
    </>
  );
};
