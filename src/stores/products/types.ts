import { Product, CreateProductForm } from '@/services/products.service';
import { PaginationMeta } from '@/types';
import { SearchFilters } from '@/lib/validations/schema';

export interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: SearchFilters;
}

export interface ProductsActions {
  fetchProducts: (page?: number, search?: string) => Promise<void>;
  createProduct: (data: CreateProductForm) => Promise<void>;
  updateProduct: (id: number, data: Partial<CreateProductForm>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setCurrentPage: (page: number) => void;
}

export type ProductsStore = ProductsState & ProductsActions;
