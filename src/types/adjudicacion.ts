import { Cotizacion, CotizacionProducto } from './cotizacion';
import { Licitacion } from './licitacion';

export interface Adjudicacion {
  id: string
  cotizacion_id: string
  licitacion_id: string
  estado: 'Adj Total' | 'Parcial'
  cantidad_total: number
  precio_total_sin_iva: number
  precio_total_con_iva: number
  fecha_adjudicacion: string
  created_at: string
  updated_at: string
  productos?: AdjudicacionProducto[]
  cotizacion?: Cotizacion
  licitacion?: Licitacion
}

export interface AdjudicacionProducto {
  id: string
  adjudicacion_id: string
  cotizacion_producto_id: string
  sku: string
  cantidad_adjudicada: number
  precio_unitario: number
  created_at: string
  cotizacion_producto?: CotizacionProducto
}
