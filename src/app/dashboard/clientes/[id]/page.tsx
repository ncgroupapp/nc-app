"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Building2, FileText, CheckCircle2 } from "lucide-react";
import { Cliente } from "@/types";
import { clientesService } from "@/services/clientes.service";
import { cotizacionesService, Quotation } from "@/services/cotizaciones.service";
import { adjudicacionesService, Adjudication } from "@/services/adjudicaciones.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<Cliente | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [adjudications, setAdjudications] = useState<Adjudication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientData, quotationsData, adjudicationsData] = await Promise.all([
          clientesService.getById(id),
          cotizacionesService.getByClientId(id),
          adjudicacionesService.getByClientId(id)
        ]);

        if (clientData.success) {
          setClient(clientData.data);
        } else {
          setError(clientData.message || "Error al cargar el cliente");
        }

        setQuotations(Array.isArray(quotationsData) ? quotationsData : []);
        setAdjudications(Array.isArray(adjudicationsData) ? adjudicationsData : []);
      } catch (err) {
        console.error(err);
        setError("Ocurrió un error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return <ClientDetailSkeleton />;
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p className="text-muted-foreground mb-4">{error || "Cliente no encontrado"}</p>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {client.identifier}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Info Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.address}</span>
                </div>
              )}
              <div className="h-[1px] w-full bg-border" />
              <div className="text-xs text-muted-foreground">
                <p>
                  Registrado el:{" "}
                  {client.created_at && isValid(new Date(client.created_at))
                    ? format(new Date(client.created_at), "PPP", { locale: es })
                    : "Fecha desconocida"}
                </p>
              </div>
            </CardContent>
          </Card>

          {client.contacts && client.contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Contactos Adicionales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.contacts.map((contact, index) => (
                  <div key={index} className="space-y-1">
                    <p className="font-medium text-sm">{contact.name}</p>
                    {contact.email && <p className="text-xs text-muted-foreground">{contact.email}</p>}
                    {contact.phone && <p className="text-xs text-muted-foreground">{contact.phone}</p>}
                    {index < (client.contacts?.length || 0) - 1 && <div className="h-[1px] w-full bg-border my-2" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2">
          <Tabs defaultValue="quotations" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quotations">Cotizaciones ({quotations.length})</TabsTrigger>
              <TabsTrigger value="adjudications">Adjudicaciones ({adjudications.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quotations" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Cotizaciones</CardTitle>
                  <CardDescription>
                    Cotizaciones asociadas a este cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {quotations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay cotizaciones registradas para este cliente.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Identificador</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Total Items</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotations.map((quote) => (
                          <TableRow 
                            key={quote.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/dashboard/licitaciones/${quote.licitationId}`)} // Assuming navigation to licitation or maybe quotation detail
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                {quote.quotationIdentifier}
                              </div>
                            </TableCell>
                            <TableCell>
                              {quote.quotationDate ? format(new Date(quote.quotationDate), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={quote.status === "finalizada" ? "secondary" : "default"}>
                                {quote.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{quote.items?.length || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="adjudications" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Adjudicaciones</CardTitle>
                  <CardDescription>
                    Adjudicaciones ganadas por este cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {adjudications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay adjudicaciones registradas para este cliente.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Monto Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adjudications.map((adj) => (
                          <TableRow key={adj.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                #{adj.id}
                              </div>
                            </TableCell>
                            <TableCell>
                              {adj.adjudicationDate ? format(new Date(adj.adjudicationDate), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{adj.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {/* Displaying price if available directly on adjudication object, otherwise might need calculation */}
                              {adj.totalPriceWithIVA ? 
                                new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(adj.totalPriceWithIVA) 
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ClientDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-[300px] col-span-1 bg-muted animate-pulse rounded-lg" />
        <div className="col-span-2 space-y-4">
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
          <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
}
