import { Cliente, CreateClienteForm } from '@/types';

export interface ClientesState {
  clientes: Cliente[];
  selectedCliente: Cliente | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
  };
}

export interface ClientesActions {
  fetchClientes: () => Promise<void>;
  createCliente: (data: CreateClienteForm) => Promise<void>;
  updateCliente: (id: string, data: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  setSelectedCliente: (cliente: Cliente | null) => void;
  setFilters: (filters: Partial<ClientesState['filters']>) => void;
  resetError: () => void;
}

export type ClientesStore = ClientesState & ClientesActions;
