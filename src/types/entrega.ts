import { Adjudicacion, AdjudicacionProducto } from './adjudicacion';
import { Licitacion } from './licitacion';

export interface Entrega {
  id: string
  adjudicacion_id: string
  licitacion_id: string
  estado: 'Pendiente de Entrega' | 'En Camino' | 'Entregado' | 'Problema en Entrega'
  fecha_entrega_estimada: string
  fecha_entrega_real?: string
  observaciones?: string
  created_at: string
  updated_at: string
  productos?: EntregaProducto[]
  facturas?: Factura[]
  adjudicacion?: Adjudicacion
  licitacion?: Licitacion
}

export interface EntregaProducto {
  id: string
  entrega_id: string
  adjudicacion_producto_id: string
  sku: string
  cantidad: number
  estado_entrega: string
  created_at: string
  adjudicacion_producto?: AdjudicacionProducto
}

export interface Factura {
  id: string
  entrega_id: string
  numero_factura: string
  monto: number
  fecha_emision: string
  archivo_url?: string
  created_at: string
}
