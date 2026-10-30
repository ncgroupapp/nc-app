"use client";

import { ReactNode } from "react";
import { SearchPicker } from "@/components/remitos/search-picker";
import { clientesService } from "@/services/clientes.service";
import { Cliente } from "@/types/cliente";

export interface PickedClient {
  id: number;
  name: string;
}

interface ClientPickerProps {
  trigger: ReactNode;
  onSelect: (client: PickedClient) => void;
  variant?: "outline" | "secondary" | "default";
  className?: string;
}

/** Search the clients loaded in the app and pick one. */
export function ClientPicker({ trigger, onSelect, variant = "outline", className }: ClientPickerProps) {
  return (
    <SearchPicker<Cliente>
      trigger={trigger}
      variant={variant}
      className={className}
      placeholder="Buscar cliente por nombre o RUT..."
      search={async (term) => (await clientesService.getAll({ search: term || undefined, limit: 20 })).data}
      getKey={(client) => client.id}
      renderItem={(client) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{client.name}</div>
          {client.identifier && <div className="text-xs text-muted-foreground">RUT {client.identifier}</div>}
        </div>
      )}
      onSelect={(client) => onSelect({ id: Number(client.id), name: client.name })}
    />
  );
}
