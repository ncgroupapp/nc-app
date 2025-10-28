"use client";

import { useState } from "react";
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
  Edit,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Calculator,
  Gavel,
  Truck,
  Package,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import Link from "next/link";
import {
  Licitacion,
  Cliente,
  Producto,
  CotizacionProducto,
  Adjudicacion,
  Entrega,
} from "@/types";

// Mock data - en producción vendría de Supabase basado en el ID
const mockLicitacion: Licitacion = {
  id: "1",
  fecha_inicio: "2024-01-15",
  fecha_limite: "2024-01-30",
  cliente_id: "1",
  numero_llamado: "LIC-2024-001",
  numero_interno: "INT-2024-001",
  estado: "En espera",
  created_at: "2024-01-15T00:00:00Z",
  updated_at: "2024-01-15T00:00:00Z",
  cliente: {
    id: "1",
    nombre: "Municipalidad de Montevideo",
    identificador: "215967890012",
    email: "compras@imm.gub.uy",
    telefono: "19502020",
    direccion: "Av. 18 de Julio 1360, Montevideo",
    created_at: "",
    updated_at: "",
  },
  productos: [
    {
      id: "1",
      licitacion_id: "1",
      producto_id: "1",
      cantidad_solicitada: 10,
      created_at: "2024-01-15T00:00:00Z",
      producto: {
        id: "1",
        sku: "PROD-001",
        nombre: "Laptop Dell XPS 15",
        proveedor_id: "1",
        marca: "Dell",
        modelo: "XPS 15",
        cantidad_stock: 5,
        created_at: "",
        updated_at: "",
      },
    },
    {
      id: "2",
      licitacion_id: "1",
      producto_id: "2",
      cantidad_solicitada: 5,
      created_at: "2024-01-15T00:00:00Z",
      producto: {
        id: "2",
        sku: "PROD-002",
        nombre: 'Monitor Samsung 27"',
        proveedor_id: "2",
        marca: "Samsung",
        modelo: "S27R350",
        cantidad_stock: 15,
        created_at: "",
        updated_at: "",
      },
    },
  ],
};

const mockCotizacionProductos: CotizacionProducto[] = [
  {
    id: "1",
    cotizacion_id: "1",
    producto_id: "1",
    cantidad: 10,
    proveedor_id: "1",
    sku: "PROD-001",
    plazo_entrega: 15,
    precio_unitario: 1500,
    precio_con_iva: 1800,
    precio_sin_iva: 1500,
    iva_incluido: true,
    estado: "En espera",
    es_stock: true,
    created_at: "2024-01-16T00:00:00Z",
    updated_at: "2024-01-16T00:00:00Z",
    producto: mockLicitacion.productos![0].producto,
  },
  {
    id: "2",
    cotizacion_id: "1",
    producto_id: "2",
    cantidad: 5,
    proveedor_id: "2",
    sku: "PROD-002",
    plazo_entrega: 20,
    precio_unitario: 300,
    precio_con_iva: 363,
    precio_sin_iva: 300,
    iva_incluido: true,
    estado: "En espera",
    es_stock: true,
    created_at: "2024-01-16T00:00:00Z",
    updated_at: "2024-01-16T00:00:00Z",
    producto: mockLicitacion.productos![1].producto,
  },
];

export default function LicitacionDetailPage() {
  const params = useParams();
  const [licitacion] = useState<Licitacion>(mockLicitacion);
  const [cotizacionProductos, setCotizacionProductos] = useState<
    CotizacionProducto[]
  >(mockCotizacionProductos);
  const [isCotizacionDialogOpen, setIsCotizacionDialogOpen] = useState(false);
  const [selectedAdjudicacion, setSelectedAdjudicacion] = useState<string>("");

  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case "En espera":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          label: "En espera",
        };
      case "Cotización":
        return {
          icon: Calculator,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          label: "Cotización",
        };
      case "Adjudicada":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          label: "Adjudicada",
        };
      case "No Adjudicada":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          label: "No Adjudicada",
        };
      case "Adjudicación Parcial":
        return {
          icon: AlertCircle,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          label: "Adjudicación Parcial",
        };
      case "Adjudicación Total":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          label: "Adjudicación Total",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          label: estado,
        };
    }
  };

  const getStockStatus = (stock: number, solicitado: number) => {
    if (stock >= solicitado)
      return {
        status: "Disponible",
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
    if (stock > 0)
      return {
        status: "Stock Insuficiente",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      };
    return {
      status: "Sin Stock",
      color: "text-red-600",
      bgColor: "bg-red-100",
    };
  };

  const calcularTotales = () => {
    const subtotal = cotizacionProductos.reduce(
      (sum, item) => sum + item.precio_unitario * item.cantidad,
      0,
    );
    const iva = cotizacionProductos.reduce(
      (sum, item) =>
        sum + (item.precio_con_iva - item.precio_sin_iva) * item.cantidad,
      0,
    );
    const total = cotizacionProductos.reduce(
      (sum, item) => sum + item.precio_con_iva * item.cantidad,
      0,
    );
    return { subtotal, iva, total };
  };

  const handleAdjudicar = (tipo: string) => {
    // Lógica para adjudicar
    console.log("Adjudicando como:", tipo);
  };

  const handleRegistrarGanador = (productoId: string) => {
    // Lógica para registrar ganador
    console.log("Registrando ganador para producto:", productoId);
  };

  const { subtotal, iva, total } = calcularTotales();
  const estadoInfo = getEstadoInfo(licitacion.estado);

  return (
    <div className="space-y-6">
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
              {licitacion.numero_llamado} - {licitacion.numero_interno}
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
              <Label className="text-sm font-medium text-gray-500">
                Cliente
              </Label>
              <div className="mt-1">
                <p className="font-medium">{licitacion.cliente?.nombre}</p>
                <p className="text-sm text-gray-500">
                  {licitacion.cliente?.identificador}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Fechas
              </Label>
              <div className="mt-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    Inicio: {licitacion.fecha_inicio}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    Límite: {licitacion.fecha_limite}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Contacto
              </Label>
              <div className="mt-1 space-y-1">
                {licitacion.cliente?.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{licitacion.cliente.email}</span>
                  </div>
                )}
                {licitacion.cliente?.telefono && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {licitacion.cliente.telefono}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Dirección
              </Label>
              <div className="mt-1">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {licitacion.cliente?.direccion}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="productos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="productos">Productos Solicitados</TabsTrigger>
          <TabsTrigger value="cotizacion">Cotización</TabsTrigger>
          <TabsTrigger value="entrega">Entrega de Productos</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
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
                  {licitacion.productos?.length} productos
                </Badge>
              </CardTitle>
              <CardDescription>
                Productos incluidos en esta licitación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Marca/Modelo</TableHead>
                    <TableHead>Cantidad Solicitada</TableHead>
                    <TableHead>Stock Disponible</TableHead>
                    <TableHead>Estado de Stock</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licitacion.productos?.map((item) => {
                    const stockStatus = getStockStatus(
                      item.producto?.cantidad_stock || 0,
                      item.cantidad_solicitada,
                    );
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.producto?.sku}
                        </TableCell>
                        <TableCell>{item.producto?.nombre}</TableCell>
                        <TableCell>
                          {item.producto?.marca} {item.producto?.modelo}
                        </TableCell>
                        <TableCell>{item.cantidad_solicitada}</TableCell>
                        <TableCell>{item.producto?.cantidad_stock}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${stockStatus.bgColor} ${stockStatus.color} border-none`}
                          >
                            {stockStatus.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cotización */}
        <TabsContent value="cotizacion" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Cotización</h3>
              <p className="text-muted-foreground">
                Detalles de la cotización actual
              </p>
            </div>
            <Dialog
              open={isCotizacionDialogOpen}
              onOpenChange={setIsCotizacionDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producto a Cotización
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Agregar Producto a Cotización</DialogTitle>
                  <DialogDescription>
                    Complete los detalles del producto para la cotización
                  </DialogDescription>
                </DialogHeader>
                {/* Formulario para agregar producto a cotización */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Producto</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {licitacion.productos?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.producto?.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio Unitario</Label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>IVA</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Incluir IVA" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="con">Con IVA</SelectItem>
                          <SelectItem value="sin">Sin IVA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plazo de Entrega (días)</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stock">De Stock</SelectItem>
                          <SelectItem value="oferta">Por Oferta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCotizacionDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button>Agregar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Productos de la Cotización</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unitario</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cotizacionProductos.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {item.producto?.nombre}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.sku}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>
                            ${item.precio_unitario.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            ${(item.precio_con_iva * item.cantidad).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.estado === "En espera"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {item.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Cotización</CardTitle>
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
                    <Button className="w-full" variant="outline">
                      <Calculator className="mr-2 h-4 w-4" />
                      Generar PDF
                    </Button>
                    <Button className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Finalizar Cotización
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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
              <div className="text-center py-8 text-gray-500">
                No hay productos adjudicados para mostrar.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Cambios</CardTitle>
              <CardDescription>
                Registro de todas las modificaciones realizadas en esta
                licitación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 pb-4 border-b">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Licitación creada</p>
                    <p className="text-sm text-gray-500">15/01/2024 - 10:30</p>
                    <p className="text-sm text-gray-600">
                      Se creó la licación con estado &quot;En espera&quot;
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 pb-4 border-b">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Cotización iniciada</p>
                    <p className="text-sm text-gray-500">16/01/2024 - 14:20</p>
                    <p className="text-sm text-gray-600">
                      Se inició el proceso de cotización
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Acciones rápidas */}
      {/*{licitacion.estado === 'Cotización' && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones de Adjudicación</CardTitle>
            <CardDescription>
              Opciones para gestionar el resultado de esta licitación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button onClick={() => handleAdjudicar('total')} className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                Adjudicación Total
              </Button>
              <Button onClick={() => handleAdjudicar('parcial')} variant="outline" className="flex-1">
                <AlertCircle className="mr-2 h-4 w-4" />
                Adjudicación Parcial
              </Button>
              <Button onClick={() => handleAdjudicar('no')} variant="destructive" className="flex-1">
                <XCircle className="mr-2 h-4 w-4" />
                No Adjudicada
              </Button>
            </div>
          </CardContent>
        </Card>
      )}*/}
    </div>
  );
}
