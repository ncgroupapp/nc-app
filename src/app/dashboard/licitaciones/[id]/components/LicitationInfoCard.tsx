import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, FileText, Mail, MapPin, Phone, User } from "lucide-react";
import { Licitation } from "@/services/licitaciones.service";

interface LicitationInfoCardProps {
  licitation: Licitation;
}

export const LicitationInfoCard = ({ licitation }: LicitationInfoCardProps) => {
  const contact = licitation.client?.contacts?.[0];

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          Información General
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>Cliente</span>
            </div>
            <div className="pl-5.5">
              <p className="font-bold text-sm">{licitation.client?.name}</p>
              <p className="text-xs text-muted-foreground font-medium">{licitation.client?.identifier}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Plazos</span>
            </div>
            <div className="pl-5.5 space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-muted-foreground min-w-[45px]">Inicio:</span>
                <span className="text-xs font-bold">{new Date(licitation.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-muted-foreground min-w-[45px]">Límite:</span>
                <span className="text-xs font-bold text-red-600">{new Date(licitation.deadlineDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>Contacto</span>
            </div>
            <div className="pl-5.5 space-y-1.5">
              {contact?.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium truncate max-w-[150px]">{contact.email}</span>
                </div>
              )}
              {contact?.phone ? (
                <div className="flex items-center space-x-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{contact.phone}</span>
                </div>
              ) : !contact?.email && (
                <span className="text-xs text-muted-foreground italic">No especificado</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>Ubicación</span>
            </div>
            <div className="pl-5.5">
              <p className="text-xs font-medium leading-relaxed">
                {contact?.address || 'Dirección no especificada'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
