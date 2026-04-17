'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { proveedoresService } from '@/services/proveedores.service'
import { Proveedor } from '@/types/proveedor'
import { cotizacionesService, ProviderQuotationHistory } from '@/services/cotizaciones.service'
import { adjudicacionesService, ProviderAdjudicationHistory } from '@/services/adjudicaciones.service'
import { AlertCircle, ArrowLeft, Award, Building, Calendar, FileText, Mail, MapPin, Phone, Tag, Users, Globe, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FadeIn } from '@/components/common/fade-in'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProveedorDetailPage() {
  const params = useParams()
  const router = useRouter()
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
    return <ProviderDetailSkeleton />
  }

  if (error || !proveedor) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[60vh] text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {error || "No pudimos encontrar el proveedor que estás buscando."}
        </p>
        <Button onClick={() => router.back()}>Volver al listado</Button>
      </div>
    )
  }

  const getStatusInfo = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('finalizada') || s.includes('adjudicada') || s.includes('total')) {
      return { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Finalizada" };
    } else if (s.includes('enviada')) {
      return { icon: ExternalLink, color: "text-purple-600", bgColor: "bg-purple-100", label: "Enviada" };
    } else if (s.includes('rechazada')) {
      return { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100", label: "Rechazada" };
    }
    return { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-100", label: status };
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <FadeIn direction="none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              aria-label="Volver"
              className="h-9 w-9 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{proveedor.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Building className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <p className="text-muted-foreground font-medium">
                  {proveedor.rut || "Sin RUT"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Info & Contacts */}
        <div className="lg:col-span-4 space-y-6">
          <FadeIn delay={100}>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Información del Proveedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-4 text-sm">
                  {proveedor.country && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">País</span>
                        <span className="font-medium">{proveedor.country}</span>
                      </div>
                    </div>
                  )}
                  {proveedor.direccion && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Dirección</span>
                        <span className="font-medium">{proveedor.direccion}</span>
                      </div>
                    </div>
                  )}
                  {proveedor.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Email</span>
                        <a href={`mailto:${proveedor.email}`} className="font-medium hover:text-primary hover:underline">{proveedor.email}</a>
                      </div>
                    </div>
                  )}
                  {proveedor.telefono && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Teléfono</span>
                        <a href={`tel:${proveedor.telefono}`} className="font-medium hover:text-primary hover:underline">{proveedor.telefono}</a>
                      </div>
                    </div>
                  )}
                  {(proveedor.brands && proveedor.brands.length > 0) || proveedor.brand ? (
                    <div className="flex items-start gap-3">
                      <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Marcas Representadas</span>
                        <div className="flex flex-wrap gap-1.5">
                          {proveedor.brands && proveedor.brands.length > 0
                            ? proveedor.brands.map((brand, index) => (<Badge key={index} variant="secondary" className="font-medium text-[10px]">{brand}</Badge>))
                            : (<Badge variant="secondary" className="font-medium text-[10px]">{proveedor.brand}</Badge>)}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-3 pt-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase font-semibold">Registrado el</span>
                      <span className="font-medium">{new Date(proveedor.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {proveedor.contacts && proveedor.contacts.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      Contactos Adicionales
                    </h3>
                    <div className="space-y-3">
                      {proveedor.contacts.map((contact, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors space-y-2">
                          <div className="font-semibold text-sm">{contact.name}</div>
                          <div className="grid grid-cols-1 gap-1">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Right Column: History Tabs */}
        <div className="lg:col-span-8">
          <FadeIn delay={300}>
            <Tabs defaultValue="cotizaciones" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1 h-auto mb-6 border">
                <TabsTrigger value="cotizaciones" className="data-[state=active]:bg-background py-2 transition-all font-semibold cursor-pointer">
                  Cotizaciones ({quotationHistory.length})
                </TabsTrigger>
                <TabsTrigger value="adjudicaciones" className="data-[state=active]:bg-background py-2 transition-all font-semibold">
                  Adjudicaciones ({adjudicationHistory.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cotizaciones" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <Card className="border shadow-sm bg-card overflow-hidden">
                  <CardHeader className="px-6 pt-6 pb-4">
                    <CardTitle className="text-xl">Historial de Cotizaciones</CardTitle>
                    <CardDescription>Seguimiento de ofertas realizadas por este proveedor</CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="rounded-md border overflow-hidden bg-background">
                      {quotationHistory.length > 0 ? (
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Identificador</TableHead>
                              <TableHead>Producto</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Precio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quotationHistory.map((item, idx) => {
                              const statusInfo = getStatusInfo(item.status);
                              return (
                                <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                                  <TableCell className="text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3 w-3 text-muted-foreground" />
                                      {new Date(item.date).toLocaleDateString()}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm font-medium">{item.quotationIdentifier}</TableCell>
                                  <TableCell className="text-sm">{item.productName}</TableCell>
                                  <TableCell>
                                    <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none font-medium text-[10px] h-5 px-1.5`}>
                                      <statusInfo.icon className="mr-1 h-2.5 w-2.5" />
                                      {statusInfo.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-xs">
                                    <span className="text-[10px] text-muted-foreground mr-1">{item.currency}</span>
                                    {item.price?.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>No hay historial de cotizaciones disponible.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="adjudicaciones" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <Card className="border shadow-sm bg-card overflow-hidden">
                  <CardHeader className="px-6 pt-6 pb-4">
                    <CardTitle className="text-xl">Historial de Adjudicaciones</CardTitle>
                    <CardDescription>Productos efectivamente vendidos por este proveedor</CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="rounded-md border overflow-hidden bg-background">
                      {adjudicationHistory.length > 0 ? (
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">Cant.</TableHead>
                              <TableHead className="text-right">Unitario</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {adjudicationHistory.map((item, idx) => (
                              <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="text-xs font-medium whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    {new Date(item.date).toLocaleDateString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{item.productName}</span>
                                    {item.licitationNumber && (
                                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Lic: {item.licitationNumber}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">{item.quantity}</TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                  <span className="text-[10px] text-muted-foreground mr-1">{item.currency}</span>
                                  {item.unitPrice?.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-bold text-sm text-green-700 whitespace-nowrap">
                                  <span className="text-[10px] opacity-70 mr-1">{item.currency}</span>
                                  {item.totalPrice?.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Award className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>No hay historial de adjudicaciones disponible.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function ProviderDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
