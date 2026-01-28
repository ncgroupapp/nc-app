import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Licitation } from "@/services/licitaciones.service";
import { getEstadoInfo } from "../utils/statusHelpers";

interface LicitationHeaderProps {
  licitation: Licitation;
}

export const LicitationHeader = ({ licitation }: LicitationHeaderProps) => {
  const estadoInfo = getEstadoInfo(licitation.status);

  return (
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
  );
};
