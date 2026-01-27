"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Calculator,
  Truck,
  Package,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Download,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { licitacionesService, Licitation, LicitationStatus } from "@/services/licitaciones.service";
import { 
  cotizacionesService, 
  Quotation, 
  QuotationItem, 
  CreateQuotationDto 
} from "@/services/cotizaciones.service";
import { adjudicacionesService, Adjudication, CreateAdjudicationDto } from "@/services/adjudicaciones.service";
import { QuotationStatus, QuotationAwardStatus, Currency, AdjudicationStatus } from "@/types";
import { QuotationItemForm } from "@/components/quotations";


export default function LicitacionDetailPage() {
  const params = useParams();
  const licitationId = parseInt(params.id as string);

  const [licitation, setLicitation] = useState<Licitation | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [adjudications, setAdjudications] = useState<Adjudication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  
  // Create Quotation Modal State
  const [isCreateQuotationDialogOpen, setIsCreateQuotationDialogOpen] = useState(false);
  const [createQuotationData, setCreateQuotationData] = useState({
    quotationIdentifier: '',
    currency: Currency.UYU as Currency,
    observations: '',
    paymentForm: '30 días',
    validity: '15 días'
  });
  
  // Item Editing State
  const [editingItem, setEditingItem] = useState<QuotationItem | null>(null);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  
  // Adjudication State
  const [awardingItem, setAwardingItem] = useState<QuotationItem | null>(null);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [awardQuantity, setAwardQuantity] = useState<number>(0);
  const [isFullAward, setIsFullAward] = useState(false);

  
  const [rejectingItem, setRejectingItem] = useState<QuotationItem | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [competitorData, setCompetitorData] = useState({ winnerName: '', winnerPrice: 0, notes: '', winnerRut: '' });

  const [newItemData, setNewItemData] = useState({
    productId: '',
    productName: '',
    quantity: 1,
    priceWithoutIVA: 0,
    ivaPercentage: 22,
    deliveryTime: 15,
    inStock: true,
    currency: Currency.UYU as Currency
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load licitation
      const licitationData = await licitacionesService.getById(licitationId);
      setLicitation(licitationData);
      
      // Try to load existing quotation for this licitation
      try {
        const quotationsRes = await cotizacionesService.getAll({ page: 1, limit: 100 });
        const existingQuotation = quotationsRes.data?.find(q => q.licitationId === licitationId);
        if (existingQuotation) {
          setQuotation(existingQuotation);
        }
      } catch {
        // No quotation yet, that's ok
      }
      
      // Load adjudications
      try {
        const adjudicationsData = await adjudicacionesService.getByLicitation(licitationId);
        // Handle both array and paginated response formats
        if (Array.isArray(adjudicationsData)) {
          setAdjudications(adjudicationsData);
        } else if (adjudicationsData && typeof adjudicationsData === 'object' && 'data' in adjudicationsData) {
          setAdjudications((adjudicationsData as { data: Adjudication[] }).data || []);
        } else {
          setAdjudications([]);
        }
      } catch {
        // No adjudications yet
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar la licitación');
    } finally {
      setLoading(false);
    }
  }, [licitationId]);

  useEffect(() => {
    if (licitationId) {
      loadData();
    }
  }, [licitationId, loadData]);

  const getEstadoInfo = (status: LicitationStatus) => {
    switch (status) {
      case LicitationStatus.PENDING:
        return { icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-100", label: "En espera" };
      case LicitationStatus.PARTIAL_ADJUDICATION:
        return { icon: AlertCircle, color: "text-orange-600", bgColor: "bg-orange-100", label: "Adjudicación Parcial" };
      case LicitationStatus.NOT_ADJUDICATED:
        return { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100", label: "No Adjudicada" };
      case LicitationStatus.TOTAL_ADJUDICATION:
        return { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Adjudicación Total" };
      default:
        return { icon: Clock, color: "text-gray-600", bgColor: "bg-gray-100", label: status };
    }
  };

  const getAwardStatusBadge = (status: QuotationAwardStatus) => {
    switch (status) {
      case QuotationAwardStatus.AWARDED:
        return { color: "bg-green-100 text-green-700", label: "Adjudicado" };
      case QuotationAwardStatus.NOT_AWARDED:
        return { color: "bg-red-100 text-red-700", label: "No Adjudicado" };
      case QuotationAwardStatus.PENDING:
      default:
        return { color: "bg-yellow-100 text-yellow-700", label: "En Espera" };
    }
  };

  // Abre el modal de crear cotización con valores por defecto
  const handleOpenCreateQuotationDialog = () => {
    if (!licitation) return;
    
    // Generar identificador por defecto
    const defaultIdentifier = `COT-${licitation.callNumber}-${Date.now()}`;
    
    setCreateQuotationData({
      quotationIdentifier: defaultIdentifier,
      currency: Currency.UYU,
      observations: '',
      paymentForm: '30 días',
      validity: '15 días'
    });
    
    setIsCreateQuotationDialogOpen(true);
  };

  // Ejecuta la creación de cotización cuando el usuario confirma en el modal
  const handleConfirmCreateQuotation = async () => {
    if (!licitation) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const createData: CreateQuotationDto = {
        quotationIdentifier: createQuotationData.quotationIdentifier,
        licitationId: licitationId,
        status: QuotationStatus.CREATED,
        clientId: licitation.clientId,
        clientName: licitation.client?.name,
        observations: createQuotationData.observations || undefined,
        paymentForm: createQuotationData.paymentForm || undefined,
        validity: createQuotationData.validity || undefined,
        items: licitation.licitationProducts?.map(lp => ({
          productId: lp.product.id,
          productName: lp.product.name,
          inStock: (lp.product.stockQuantity || 0) > 0,
          quantity: lp.quantity,
          priceWithoutIVA: 0.01,
          priceWithIVA: 0.01,
          ivaPercentage: 22,
          currency: createQuotationData.currency,
          awardStatus: QuotationAwardStatus.PENDING
        })) || []
      };
      
      const newQuotation = await cotizacionesService.create(createData);
      setQuotation(newQuotation);
      setIsCreateQuotationDialogOpen(false);
    } catch (err) {
      console.error('Error creating quotation:', err);
      setError('Error al crear la cotización');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddItemToQuotation = async () => {
    if (!quotation) return;
    
    try {
      setSubmitting(true);
      
      const priceWithIVA = newItemData.priceWithoutIVA * (1 + newItemData.ivaPercentage / 100);
      
      const newItem: QuotationItem = {
        productId: parseInt(newItemData.productId) || undefined,
        productName: newItemData.productName,
        inStock: newItemData.inStock,
        quantity: newItemData.quantity,
        priceWithoutIVA: newItemData.priceWithoutIVA,
        priceWithIVA: priceWithIVA,
        ivaPercentage: newItemData.ivaPercentage,
        deliveryTime: newItemData.deliveryTime,
        currency: newItemData.currency,
        awardStatus: QuotationAwardStatus.PENDING
      };
      
      const updatedQuotation = await cotizacionesService.update(quotation.id, {
        items: [...quotation.items, newItem]
      });
      
      setQuotation(updatedQuotation);
      setIsQuotationDialogOpen(false);
      setNewItemData({
        productId: '',
        productName: '',
        quantity: 1,
        priceWithoutIVA: 0,
        ivaPercentage: 22,
        deliveryTime: 15,
        inStock: true,
        currency: Currency.UYU
      });
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Error al agregar item a la cotización');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeQuotation = async () => {
    if (!quotation) return;
    
    try {
      setSubmitting(true);
      const finalized = await cotizacionesService.finalize(quotation.id);
      setQuotation(finalized);
    } catch (err) {
      console.error('Error finalizing quotation:', err);
      setError('Error al finalizar la cotización');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!quotation) return;
    
    try {
      const blob = await cotizacionesService.downloadPdf(quotation.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion_${quotation.quotationIdentifier}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Error al descargar el PDF');
    }
  };

  
  const handleEditItem = (item: QuotationItem) => {
    setEditingItem(item);
    setNewItemData({
      productId: item.productId?.toString() || '',
      productName: item.productName,
      quantity: item.quantity,
      priceWithoutIVA: item.priceWithoutIVA,
      ivaPercentage: item.ivaPercentage,
      deliveryTime: item.deliveryTime || 0,
      inStock: item.inStock,
      currency: item.currency
    });
    setIsEditItemDialogOpen(true);
  };



  const handleUpdateItem = async () => {
    if (!quotation || !editingItem) return;
    
    try {
      setSubmitting(true);
      const priceWithIVA = newItemData.priceWithoutIVA * (1 + newItemData.ivaPercentage / 100);
      
      const updatedItems = quotation.items.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            productName: newItemData.productName,
            inStock: newItemData.inStock,
            quantity: newItemData.quantity,
            priceWithoutIVA: newItemData.priceWithoutIVA,
            priceWithIVA: priceWithIVA,
            ivaPercentage: newItemData.ivaPercentage,
            deliveryTime: newItemData.deliveryTime,
            currency: newItemData.currency
          };
        }
        return item;
      });
      
      const updatedQuotation = await cotizacionesService.update(quotation.id, {
        items: updatedItems
      });
      
      setQuotation(updatedQuotation);
      setIsEditItemDialogOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Error al actualizar item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAward = (item: QuotationItem, isTotal: boolean = false) => {
    setAwardingItem(item);
    setAwardQuantity(item.quantity);
    setIsFullAward(isTotal);
    setIsAwardDialogOpen(true);
  };

  const handleConfirmAward = async () => {
    if (!quotation || !awardingItem || !licitation) return;
    
    try {
      setSubmitting(true);
      
      const status = isFullAward || awardQuantity >= awardingItem.quantity ? 'total' : 'parcial';

      const adjudicationData: any = {
        quotationId: quotation.id,
        licitationId: licitationId,
        status: status,
        items: [{
          productId: awardingItem.productId || undefined,
          quantity: awardQuantity,
          unitPrice: awardingItem.priceWithoutIVA
        }],
        nonAwardedItems: []
      };
      
      await adjudicacionesService.create(adjudicationData);
      await loadData();
      
      setIsAwardDialogOpen(false);
      setAwardingItem(null);
      
    } catch (err) {
      console.error('Error awarding item:', err);
      setError('Error al adjudicar item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = (item: QuotationItem) => {
    setRejectingItem(item);
    setCompetitorData({ winnerName: '', winnerPrice: 0, notes: '', winnerRut: '' });
    setIsRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!quotation || !rejectingItem || !licitation) return;
    
    try {
      setSubmitting(true);
      
      const adjudicationData: CreateAdjudicationDto = {
        quotationId: quotation.id,
        licitationId: licitationId,
        status: AdjudicationStatus.PARTIAL,
        items: [],
        nonAwardedItems: [{
          productId: rejectingItem.productId || undefined,
          competitorName: competitorData.winnerName,
          competitorRut: competitorData.winnerRut || 'N/A',
          competitorPrice: competitorData.winnerPrice,
          competitorBrand: 'N/A'
        }]
      };
      
      await adjudicacionesService.create(adjudicationData);
      await loadData();
      
      setIsRejectDialogOpen(false);
      setRejectingItem(null);
    } catch (err) {
      console.error('Error rejecting item:', err);
      setError('Error al rechazar item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (item: QuotationItem, status: QuotationAwardStatus) => {
    if (quotation?.status === QuotationStatus.FINALIZED) return;

    if (status === QuotationAwardStatus.AWARDED) {
      handleOpenAward(item, true); // true for Total
    } else if (status === QuotationAwardStatus.PARTIALLY_AWARDED) {
      handleOpenAward(item, false); // false for Partial
    } else if (status === QuotationAwardStatus.NOT_AWARDED) {
      handleOpenReject(item);
    }
  };

  const calcularTotales = () => {
    if (!quotation?.items) return { subtotal: 0, iva: 0, total: 0 };
    
    const subtotal = quotation.items.reduce(
      (sum, item) => sum + (Number(item.priceWithoutIVA) * Number(item.quantity)),
      0
    );
    const total = quotation.items.reduce(
      (sum, item) => sum + (Number(item.priceWithIVA) * Number(item.quantity)),
      0
    );
    const iva = total - subtotal;
    
    return { subtotal, iva, total };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando licitación...</span>
      </div>
    );
  }

  if (!licitation) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Licitación no encontrada</p>
        <Link href="/dashboard/licitaciones">
          <Button className="mt-4">Volver al listado</Button>
        </Link>
      </div>
    );
  }

  const { subtotal, iva, total } = calcularTotales();
  const estadoInfo = getEstadoInfo(licitation.status);
  const contact = licitation.client?.contacts?.[0];

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/licitaciones">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Detalles de Licitación
            </h1>
            <p className="text-muted-foreground">
              {licitation.callNumber} - {licitation.internalNumber}
            </p>
          </div>
        </div>
        <Badge
          className={`${estadoInfo.bgColor} ${estadoInfo.color} border-none text-sm px-3 py-1`}
        >
          <estadoInfo.icon className="mr-2 h-4 w-4" />
          {estadoInfo.label}
        </Badge>
      </div>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Información General</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-500">Cliente</Label>
              <div className="mt-1">
                <p className="font-medium">{licitation.client?.name}</p>
                <p className="text-sm text-gray-500">{licitation.client?.identifier}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Fechas</Label>
              <div className="mt-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    Inicio: {new Date(licitation.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    Límite: {new Date(licitation.deadlineDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Contacto</Label>
              <div className="mt-1 space-y-1">
                {contact?.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{contact.email}</span>
                  </div>
                )}
                {contact?.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{contact.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Dirección</Label>
              <div className="mt-1">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{contact?.address || 'No especificada'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="productos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="productos">Productos Solicitados</TabsTrigger>
          <TabsTrigger value="cotizacion">Cotización</TabsTrigger>
          <TabsTrigger value="entrega">Entrega de Productos</TabsTrigger>
        </TabsList>

        {/* Tab: Productos Solicitados */}
        <TabsContent value="productos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Productos Solicitados</span>
                </span>
                <Badge variant="outline">
                  {licitation.licitationProducts?.length || 0} productos
                </Badge>
              </CardTitle>
              <CardDescription>
                Productos incluidos en esta licitación
              </CardDescription>
            </CardHeader>
            <CardContent>
            {licitation.licitationProducts && licitation.licitationProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead className="text-center">Cantidad Solicitada</TableHead>
                      <TableHead>Stock Disponible</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licitation.licitationProducts.map((lp) => (
                      <TableRow key={lp.id}>
                        <TableCell className="font-medium">{lp.product.name}</TableCell>
                        <TableCell>
                          {lp.product.brand} {lp.product.model}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-bold">
                            {lp.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={lp.product.stockQuantity && lp.product.stockQuantity > 0 ? "default" : "destructive"}>
                            {lp.product.stockQuantity || 0}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay productos registrados en esta licitación
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cotización */}
        <TabsContent value="cotizacion" className="space-y-4">
          {!quotation ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay cotización creada</h3>
                  <p className="text-gray-500 mb-4">
                    Cree una cotización para comenzar a agregar precios y condiciones
                  </p>
                  <Button onClick={handleOpenCreateQuotationDialog} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Crear Cotización
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
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
                        <Button onClick={handleAddItemToQuotation} disabled={submitting || !newItemData.productName}>
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
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Precio Unit.</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quotation.items.map((item, index) => {
                              const getStatusParams = (status: string) => {
                                switch (status) {
                                  case QuotationAwardStatus.AWARDED:
                                    return { label: 'Adjudicado', color: 'bg-green-100 text-green-800 hover:bg-green-100' };
                                  case QuotationAwardStatus.PARTIALLY_AWARDED:
                                    return { label: 'Parcial', color: 'bg-blue-100 text-blue-800 hover:bg-blue-100' };
                                  case QuotationAwardStatus.NOT_AWARDED:
                                    return { label: 'No Adjudicada', color: 'bg-red-100 text-red-800 hover:bg-red-100' };
                                  default:
                                    return { label: 'En Espera', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' };
                                }
                              };
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
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>${Number(item.priceWithoutIVA).toFixed(2)}</TableCell>
                                  <TableCell>${(Number(item.priceWithIVA) * Number(item.quantity)).toFixed(2)}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <Select
                                        value={item.awardStatus}
                                        onValueChange={(val) => handleStatusChange(item, val as QuotationAwardStatus)}
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
                                        <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      ) : (
                                        item.awardStatus === QuotationAwardStatus.PENDING && (
                                          <>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                              onClick={() => handleOpenAward(item)}
                                            >
                                              <CheckCircle className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                              onClick={() => handleOpenReject(item)}
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
                        <Button className="w-full" variant="outline" onClick={handleDownloadPdf}>
                          <Download className="mr-2 h-4 w-4" />
                          Descargar PDF
                        </Button>
                        {quotation.status !== QuotationStatus.FINALIZED && (
                          <>
                            <Button 
                              className="w-full" 
                              onClick={handleFinalizeQuotation}
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
          )}
        </TabsContent>

        {/* Tab: Entrega */}
        <TabsContent value="entrega" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Entrega de Productos</span>
              </CardTitle>
              <CardDescription>
                Estado de entrega de los productos adjudicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adjudications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay productos adjudicados para mostrar.
                  {licitation.status === LicitationStatus.PENDING && (
                    <p className="mt-2 text-sm">
                      Primero debe finalizar la cotización y registrar la adjudicación.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {adjudications.map((adjudication) => (
                    <div key={adjudication.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Adjudicación #{adjudication.id}</h4>
                        <Badge>
                          {adjudication.status === AdjudicationStatus.TOTAL ? 'Total' : 'Parcial'}
                        </Badge>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Precio Unit.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adjudication.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${Number(item.unitPrice).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-500">
                          Total: ${Number(adjudication.totalPriceWithIVA).toFixed(2)} (con IVA)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Item de Cotización</DialogTitle>
          </DialogHeader>
          <QuotationItemForm
            data={newItemData}
            onChange={setNewItemData}
            showOfferSearch={true}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateItem} disabled={submitting}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
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
              <Label>Cantidad a Adjudicar (Máx: {awardingItem?.quantity})</Label>
              <Input 
                type="number" 
                max={awardingItem?.quantity}
                min={1}
                value={awardQuantity}
                disabled={isFullAward}
                onChange={(e) => setAwardQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAwardDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmAward} disabled={submitting}>
              {isFullAward ? "Confirmar Total" : "Confirmar Adjudicación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmReject} disabled={submitting || !competitorData.winnerName}>Confirmar Rechazo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Crear Cotización */}
      <Dialog open={isCreateQuotationDialogOpen} onOpenChange={setIsCreateQuotationDialogOpen}>
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
                value={createQuotationData.quotationIdentifier}
                onChange={(e) => setCreateQuotationData(prev => ({ ...prev, quotationIdentifier: e.target.value }))}
                placeholder="COT-2024-001"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={createQuotationData.currency}
                  onValueChange={(value) => setCreateQuotationData(prev => ({ ...prev, currency: value as Currency }))}
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
                  value={createQuotationData.paymentForm}
                  onChange={(e) => setCreateQuotationData(prev => ({ ...prev, paymentForm: e.target.value }))}
                  placeholder="30 días"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Validez de la Cotización</Label>
              <Input
                value={createQuotationData.validity}
                onChange={(e) => setCreateQuotationData(prev => ({ ...prev, validity: e.target.value }))}
                placeholder="15 días"
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input
                value={createQuotationData.observations}
                onChange={(e) => setCreateQuotationData(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Observaciones generales de la cotización"
              />
            </div>
            {licitation?.products && licitation.products.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> Se crearán {licitation.products.length} item(s) basados en los productos de la licitación. 
                  Podrá editar precios y cantidades después de crear la cotización.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateQuotationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmCreateQuotation} 
              disabled={submitting || !createQuotationData.quotationIdentifier}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Crear Cotización
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
