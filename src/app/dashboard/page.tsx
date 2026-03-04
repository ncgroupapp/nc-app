import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, FileText, Package, Truck } from "lucide-react";
import { FadeIn } from "@/components/common/fade-in";

export default function DashboardPage() {
  // Mock data
  const stats = {
    totalLicitaciones: 124,
    licitacionesActivas: 23,
    totalProductos: 456,
    bajoStock: 12,
    totalProveedores: 34,
    totalClientes: 28,
    adjudicacionesMes: 8,
    entregasPendientes: 15,
  };

  const recentLicitaciones = [
    { id: 1, numero: "LIC-2024-001", cliente: "Municipalidad", estado: "En espera", fecha: "2024-01-15" },
    { id: 2, numero: "LIC-2024-002", cliente: "Empresa XYZ", estado: "Cotización", fecha: "2024-01-14" },
    { id: 3, numero: "LIC-2024-003", cliente: "Gobierno", estado: "Adjudicada", fecha: "2024-01-13" },
  ];

  const stockAlerts = [
    { id: 1, sku: "PROD-001", nombre: "Producto A", stock: 2, minimo: 5 },
    { id: 2, sku: "PROD-004", nombre: "Producto D", stock: 0, minimo: 10 },
    { id: 3, sku: "PROD-007", nombre: "Producto G", stock: 3, minimo: 5 },
  ];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "En espera": return "bg-yellow-100 text-yellow-800";
      case "Cotización": return "bg-blue-100 text-blue-800";
      case "Adjudicada": return "bg-green-100 text-green-800";
      case "No Adjudicada": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del sistema de gestión de licitaciones
        </p>
      </FadeIn>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FadeIn delay={100}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Licitaciones</CardTitle>
              <FileText className="h-4 w-4 text-blue-950" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLicitaciones}</div>
              <p className="text-xs text-blue-950">+{stats.adjudicacionesMes} adjudicaciones este mes</p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={200}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Licitaciones Activas</CardTitle>
              <Clock className="h-4 w-4 text-blue-950" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.licitacionesActivas}</div>
              <p className="text-xs text-blue-950">En proceso actualmente</p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={300}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-blue-950" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProductos}</div>
              <p className="text-xs text-blue-950">{stats.bajoStock} con bajo stock</p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={400}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregas Pendientes</CardTitle>
              <Truck className="h-4 w-4 text-blue-950" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.entregasPendientes}</div>
              <p className="text-xs text-blue-950">Por entregar esta semana</p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <FadeIn delay={500} className="col-span-4">
          <Card>
            <CardHeader><CardTitle>Licitaciones Recientes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLicitaciones.map((licitacion) => (
                  <div key={licitacion.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{licitacion.numero}</p>
                        <p className="text-sm text-blue-950">{licitacion.cliente}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-blue-950">{licitacion.fecha}</span>
                      <Badge className={getEstadoColor(licitacion.estado)}>{licitacion.estado}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={600} className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>Alertas de Stock</span>
              </CardTitle>
              <CardDescription>Productos con stock bajo o agotado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stockAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50/50 hover:bg-red-100/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{alert.nombre}</p>
                      <p className="text-xs text-blue-950">{alert.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={alert.stock === 0 ? "destructive" : "outline"}>{alert.stock} unidades</Badge>
                      <p className="text-xs text-blue-950 mt-1">Mínimo: {alert.minimo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
