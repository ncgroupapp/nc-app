"use client";

import { Mail, MapPin, Phone, Calendar } from "lucide-react";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cliente } from "@/types";

interface ClientInfoCardProps {
  client: Cliente;
}

export function ClientInfoCard({ client }: ClientInfoCardProps) {
  const createdAt = client.created_at && isValid(new Date(client.created_at)) 
    ? format(new Date(client.created_at), "PPP", { locale: es }) 
    : "Fecha desconocida";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Información del Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          {client.email && (
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Correo Electrónico</span>
                <span className="text-sm font-medium">{client.email}</span>
              </div>
            </div>
          )}
          
          {client.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Teléfono</span>
                <span className="text-sm font-medium">{client.phone}</span>
              </div>
            </div>
          )}
          
          {client.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Dirección</span>
                <span className="text-sm font-medium">{client.address}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 pt-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Registrado el</span>
              <span className="text-sm font-medium">{createdAt}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
