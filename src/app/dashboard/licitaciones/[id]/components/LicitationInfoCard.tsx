import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  FileText,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Licitation } from "@/services/licitaciones.service";

interface LicitationInfoCardProps {
  licitation: Licitation;
}

export const LicitationInfoCard = ({ licitation }: LicitationInfoCardProps) => {
  const contact = licitation.client?.contacts?.[0];

  return (
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
            <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
            <div className="mt-1">
              <p className="font-medium">{licitation.client?.name}</p>
              <p className="text-sm text-muted-foreground">{licitation.client?.identifier}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Fechas</Label>
            <div className="mt-1 space-y-1">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Inicio: {new Date(licitation.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Límite: {new Date(licitation.deadlineDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Contacto</Label>
            <div className="mt-1 space-y-1">
              {contact?.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{contact.email}</span>
                </div>
              )}
              {contact?.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{contact.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Dirección</Label>
            <div className="mt-1">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{contact?.address || 'No especificada'}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
