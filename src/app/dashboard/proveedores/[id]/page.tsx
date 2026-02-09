'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { proveedoresService } from '@/services/proveedores.service'
import { Proveedor } from '@/types'
import { cotizacionesService, ProviderQuotationHistory } from '@/services/cotizaciones.service'
import { adjudicacionesService, ProviderAdjudicationHistory } from '@/services/adjudicaciones.service'
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Award,
  AlertCircle,
  Users,
  Tag
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ProveedorDetailPage() {
  const params = useParams()
  const router = useRouter()
  // Handles potential array if catch-all route, though standard [id] is string
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [quotationHistory, setQuotationHistory] = useState<ProviderQuotationHistory[]>([])
  const [adjudicationHistory, setAdjudicationHistory] = useState<ProviderAdjudicationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [proveedorData, quotesData, adjData] = await Promise.all([
          proveedoresService.getById(id),
          cotizacionesService.getByProviderId(id),
          adjudicacionesService.getByProviderId(id)
        ])
        setProveedor(proveedorData)
        setQuotationHistory(quotesData || [])
        setAdjudicationHistory(adjData || [])
      } catch (err) {
        console.error('Error loading provider data:', err)
        setError('No se pudo cargar la información del proveedor.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !proveedor) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-500 font-medium flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error || 'Proveedor no encontrado'}
        </div>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Detalle de Proveedor
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-32 bg-primary/10 flex items-center justify-center">
              <Building className="h-16 w-16 text-primary/40" />
            </div>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{proveedor.name}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 mt-1">
                {proveedor.rut && (
                  <Badge variant="outline">{proveedor.rut}</Badge>
                )}
                {proveedor.country && (
                  <Badge variant="secondary">{proveedor.country}</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-3 text-sm">
                {proveedor.direccion && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{proveedor.direccion}</span>
                  </div>
                )}

                {proveedor.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${proveedor.email}`}
                      className="hover:text-primary hover:underline"
                    >
                      {proveedor.email}
                    </a>
                  </div>
                )}

                {proveedor.telefono && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${proveedor.telefono}`}
                      className="hover:text-primary hover:underline"
                    >
                      {proveedor.telefono}
                    </a>
                  </div>
                )}

                {proveedor.contacto && (
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Contacto: {proveedor.contacto}</span>
                  </div>
                )}

                {proveedor.brand && (
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>Marca: {proveedor.brand.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Registrado:{" "}
                    {new Date(proveedor.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {proveedor.contacts && proveedor.contacts.length > 0 && (
                <>
                  <div className="border-t my-4" />
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contactos Adicionales
                  </h3>
                  <div className="space-y-3">
                    {proveedor.contacts.map((contact, index) => (
                      <div
                        key={index}
                        className="bg-secondary/10 p-3 rounded-lg text-sm space-y-1.5"
                      >
                        <div className="font-medium">{contact.name}</div>
                        {contact.email && (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Phone className="h-3 w-3" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.address && (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{contact.address}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="border-t my-4" />

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {quotationHistory.length}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Cotizaciones
                  </div>
                </div>
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {adjudicationHistory.length}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Adjudicaciones
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed History */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="h-full border-0 shadow-sm bg-transparent">
            <Tabs defaultValue="cotizaciones" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger
                    value="cotizaciones"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Cotizaciones
                  </TabsTrigger>
                  <TabsTrigger
                    value="adjudicaciones"
                    className="flex items-center gap-2"
                  >
                    <Award className="h-4 w-4" />
                    Adjudicaciones
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="cotizaciones" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Cotizaciones</CardTitle>
                    <CardDescription>
                      Cotizaciones realizadas por este proveedor en las
                      diferentes licitaciones.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {quotationHistory.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Identificador</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotationHistory.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {new Date(item.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{item.quotationIdentifier}</TableCell>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {item.currency} {item.price?.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground bg-secondary/5 rounded-lg border border-dashed text-sm">
                        No hay historial de cotizaciones disponible.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="adjudicaciones" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Adjudicaciones</CardTitle>
                    <CardDescription>
                      Productos adjudicados a este proveedor.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {adjudicationHistory.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-center">Cant.</TableHead>
                            <TableHead className="text-right">
                              Precio Unit.
                            </TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adjudicationHistory.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {new Date(item.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div>{item.productName}</div>
                                {item.licitationNumber && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    Lic: {item.licitationNumber}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {item.currency}{" "}
                                {item.unitPrice?.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-medium whitespace-nowrap">
                                {item.currency}{" "}
                                {item.totalPrice?.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground bg-secondary/5 rounded-lg border border-dashed text-sm">
                        No hay historial de adjudicaciones disponible.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
