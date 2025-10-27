import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Users, FileText, Calculator, Gavel, Truck, Ship } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Sistema de Gestión de
            <span className="text-blue-600"> Licitaciones</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Sistema integral para la gestión completa del proceso de licitaciones,
            desde la recepción hasta la adjudicación y entrega de productos.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/dashboard">Ir al Dashboard</Link>
            </Button>
            <Button variant="outline" size="lg">
              Ver Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Módulos Principales
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Todo lo que necesitas para gestionar tus licitaciones
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Package className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Gestión de Productos</CardTitle>
              <CardDescription>
                Control completo de inventario con SKU, stock y proveedores asociados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ABM de productos</li>
                <li>• Control de stock</li>
                <li>• Historial de adjudicaciones</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Proveedores y Clientes</CardTitle>
              <CardDescription>
                Gestión completa de proveedores y clientes del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Registro de contactos</li>
                <li>• Historial de licitaciones</li>
                <li>• Validación de datos</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Licitaciones</CardTitle>
              <CardDescription>
                Gestión completa del ciclo de vida de las licitaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Creación y seguimiento</li>
                <li>• Verificación de stock</li>
                <li>• Control de estados</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calculator className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Cotizaciones</CardTitle>
              <CardDescription>
                Sistema de cotización automático con cálculos de IVA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cálculo automático</li>
                <li>• Múltiples productos</li>
                <li>• Gestión de estados</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Gavel className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Adjudicaciones</CardTitle>
              <CardDescription>
                Control de adjudicaciones parciales y totales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Adjudicación parcial/total</li>
                <li>• Registro de ganadores</li>
                <li>• Trazabilidad completa</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Truck className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Entregas</CardTitle>
              <CardDescription>
                Seguimiento completo de entregas y facturación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Estados de entrega</li>
                <li>• Gestión de facturas</li>
                <li>• Fechas de entrega</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <Ship className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Importaciones</CardTitle>
              <CardDescription>
                Sistema completo para gestión de importaciones con cálculo automático de costos y tributos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <li>• Costos FOB, Flete, Seguro</li>
                <li>• Cálculo automático de CIF</li>
                <li>• Tributos oficiales (IVA, IMADUNI, etc.)</li>
                <li>• Conversión de monedas</li>
                <li>• Control de estados</li>
                <li>• Asociación con productos</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              ¿Listo para optimizar tu gestión de licitaciones?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Comienza a usar el sistema hoy mismo
            </p>
            <div className="mt-8">
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Comenzar Ahora</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
