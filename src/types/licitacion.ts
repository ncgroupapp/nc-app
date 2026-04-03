import { Cliente } from './cliente';
import { Producto } from './producto';
import { Cotizacion } from './cotizacion';
import { Adjudicacion } from './adjudicacion';
import { Entrega } from './entrega';

export interface Licitacion {
  id: string
  fecha_inicio: string
  fecha_limite: string
  cliente_id: string
  numero_llamado: string
  numero_interno: string
  estado: 'En espera' | 'Cotizada' | 'Adjudicación Parcial' | 'No Adjudicada' | 'Adjudicación Total'
  created_at: string
  updated_at: string
  cliente?: Cliente
  productos?: LicitacionProducto[]
  cotizacion?: Cotizacion
  adjudicacion?: Adjudicacion
  entrega?: Entrega[]
}

export interface LicitacionProducto {
  id: string
  licitacion_id: string
  producto_id: string
  cantidad_solicitada: number
  created_at: string
  producto?: Producto
}

export interface CreateLicitacionForm {
  fecha_inicio: string
  fecha_limite: string
  cliente_id: string
  numero_llamado: string
  numero_interno: string
  productos: {
    producto_id: string
    cantidad_solicitada: number
  }[]
}
