import { Licitacion } from './licitacion';
import { Producto } from './producto';
import { Proveedor } from './proveedor';

export interface Cotizacion {
  id: string
  licitacion_id: string
  estado: 'Creada' | 'Finalizada'
  fecha_envio?: string
  created_at: string
  updated_at: string
  productos?: CotizacionProducto[]
  licitacion?: Licitacion
}

export interface CotizacionProducto {
  id: string
  cotizacion_id: string
  producto_id: string
  cantidad: number
  proveedor_id: string
  sku: string
  plazo_entrega?: number
  precio_unitario: number
  precio_con_iva: number
  precio_sin_iva: number
  iva_incluido: boolean
  estado: 'Adjudicado' | 'Adjudicación Parcial' | 'No Adjudicado' | 'En espera'
  es_stock: boolean
  created_at: string
  updated_at: string
  producto?: Producto
  proveedor?: Proveedor
}

export interface CreateCotizacionProductoForm {
  producto_id: string
  cantidad: number
  proveedor_id: string
  sku: string
  plazo_entrega?: number
  precio_unitario: number
  precio_con_iva: number
  precio_sin_iva: number
  iva_incluido: boolean
  es_stock: boolean
}
