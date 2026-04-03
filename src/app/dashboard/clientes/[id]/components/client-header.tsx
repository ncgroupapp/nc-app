"use client";

import { ArrowLeft, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Cliente } from "@/types";

interface ClientHeaderProps {
  client: Cliente;
}

export function ClientHeader({ client }: ClientHeaderProps) {
  const router = useRouter();

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
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground font-medium">
              {client.identifier}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Aquí se podrían agregar acciones como Editar Cliente si fuera necesario */}
      </div>
    </div>
  );
}
