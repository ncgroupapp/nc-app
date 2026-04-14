import { Proveedor } from './proveedor';

export interface Producto {
  id: string | number
  sku?: string
  nombre?: string
  name?: string // Backend field
  imagen?: string
  image?: string // Backend field
  images?: string[] // Backend field
  proveedor_id?: string | number
  providerId?: number // Backend field
  marca?: string
  brand?: string // Backend field
  modelo?: string
  model?: string // Backend field
  cantidad_stock?: number
  stock?: number
  stockQuantity?: number
  detalles?: string
  details?: string // Backend field
  observaciones?: string
  observations?: string // Backend field
  chasis?: string
  chassis?: string // Backend field
  motor?: string
  equipment?: string // Backend field
  equivalentCodes?: string[]
  code?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  proveedor?: Proveedor
  provider?: Proveedor
  historial_cotizaciones?: Array<{
    id: string
    fecha: string
    monto: number
    estado: string
  }>
  quotationHistory?: any
  historial_adjudicaciones?: Array<{
    id: string
    fecha: string
    monto: number
    proveedor_id: string
  }>
  adjudicationHistory?: any
  description?: string
}

export interface Oferta {
  id: string
  producto_id: string
  proveedor_id: string
  precio: number
  fecha_entrega: string
  cantidad: number
  created_at: string
  updated_at: string
  producto?: Producto
  proveedor?: Proveedor
}

export interface CreateProductoForm {
  sku: string
  nombre: string
  imagen?: string
  proveedor_id: string
  marca?: string
  modelo?: string
  cantidad_stock: number
  detalles?: string
  observaciones?: string
  chasis?: string
  motor?: string
}

export interface CreateOfertaForm {
  producto_id: string
  proveedor_id: string
  precio: number
  fecha_entrega: string
  cantidad: number
}
