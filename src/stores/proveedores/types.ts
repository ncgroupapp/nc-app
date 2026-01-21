import { Proveedor, CreateProveedorForm, PaginationMeta } from '@/types';
import { SearchFilters } from '@/lib/validations/schema';

export interface ProveedoresState {
  proveedores: Proveedor[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: SearchFilters;
}

export interface ProveedoresActions {
  fetchProveedores: (page?: number, search?: string) => Promise<void>;
  createProveedor: (data: CreateProveedorForm) => Promise<void>;
  updateProveedor: (id: string, data: Partial<Proveedor>) => Promise<void>;
  deleteProveedor: (id: string) => Promise<void>;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setCurrentPage: (page: number) => void;
}

export type ProveedoresStore = ProveedoresState & ProveedoresActions;
