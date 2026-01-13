import { Cliente, CreateClienteForm, PaginationMeta } from '@/types';

export interface ClientesState {
  clientes: Cliente[];
  selectedCliente: Cliente | null;
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: {
    search: string;
  };
}

export interface ClientesActions {
  fetchClientes: (page?: number) => Promise<void>;
  createCliente: (data: CreateClienteForm) => Promise<void>;
  updateCliente: (id: string, data: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  setSelectedCliente: (cliente: Cliente | null) => void;
  setFilters: (filters: Partial<ClientesState['filters']>) => void;
  setCurrentPage: (page: number) => void;
  resetError: () => void;
}

export type ClientesStore = ClientesState & ClientesActions;
