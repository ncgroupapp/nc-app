import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gavel } from "lucide-react";
import { Licitation } from "@/services/licitaciones.service";
import { getEstadoInfo } from "../utils/statusHelpers";

interface LicitationHeaderProps {
  licitation: Licitation;
}

export const LicitationHeader = ({ licitation }: LicitationHeaderProps) => {
  const router = useRouter();
  const estadoInfo = getEstadoInfo(licitation.status);

  return (
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
          <h1 className="text-3xl font-bold tracking-tight">
            {licitation.callNumber || "Detalle de Licitación"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Gavel className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground font-medium">
              {licitation.internalNumber || "Sin número interno"}
            </p>
          </div>
        </div>
      </div>
      <Badge
        className={`${estadoInfo.bgColor} ${estadoInfo.color} border-none text-sm px-3 py-1 font-medium`}
      >
        <estadoInfo.icon className="mr-2 h-4 w-4" />
        {estadoInfo.label}
      </Badge>
    </div>
  );
};
