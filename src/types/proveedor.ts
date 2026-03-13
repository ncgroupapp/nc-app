export interface Proveedor {
  id: string;
  name: string;
  rut: string;
  country: string;
  pais?: string; // Deprecated: use country instead
  contacto?: string;
  email?: string;
  telefono?: string;
  website?: string;
  direccion?: string;
  brand?: string;
  brands?: string[];
  createdAt: string;
  updated_at: string;
  contacts?: Array<{
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    role?: string;
  }>;
}

export interface CreateProveedorForm {
  nombre: string
  rut: string
  pais: string
  brand_id?: number
  brands?: string[]
  contacto?: string
  email?: string
  telefono?: string
  website?: string
  direccion?: string
  contacts?: Array<{
    name: string
    email?: string
    phone?: string
    address?: string
    role?: string
  }>
}
