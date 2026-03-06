import { Proveedor } from './proveedor';

export interface Producto {
  id: string
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
  created_at: string
  updated_at: string
  proveedor?: Proveedor
  historial_cotizaciones?: Array<{
    id: string
    fecha: string
    monto: number
    estado: string
  }>
  historial_adjudicaciones?: Array<{
    id: string
    fecha: string
    monto: number
    proveedor_id: string
  }>
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
