import { Proveedor } from './proveedor';
import { Producto } from './producto';
import { Licitacion } from './licitacion';

export interface Importacion {
  id: string
  carpeta_folio: string
  proveedor_id: string
  transportista: string
  arbitraje?: number
  tipo_cambio: number
  cantidad_bultos: number
  peso_total: number
  moneda_origen: 'EUR' | 'USD' | 'UYU'
  fecha_importacion: string
  estado: 'En Tránsito' | 'En Aduana' | 'Liberada' | 'Entregada'
  created_at: string
  updated_at: string
  proveedor?: Proveedor
  costos?: ImportacionCostos
  productos?: ImportacionProducto[]
  licitaciones?: Licitacion[]
}

export interface ImportacionCostos {
  id: string
  importacion_id: string
  // Costos Base
  fob?: number
  flete?: number
  seguro?: number
  cif?: number
  // Tributos Oficiales Exentos de IVA
  adelanto_iva?: number
  guia_transito?: number
  imaduni?: number
  iva?: number
  recargo?: number
  tasas_consulares?: number
  tcu?: number
  timbres_auri?: number
  tsa?: number
  gastos_bancarios?: number
  subtotal_a?: number
  // Otros Pagos Exentos de IVA
  otros_pagos_exentos?: number
  subtotal_b?: number
  // Pagos Gravados de IVA
  gastos_despacho?: number
  sobre_aduanero?: number
  honorarios?: number
  flete_externo?: number
  seguro_gravado?: number
  flete_interno?: number
  iva_gravados?: number
  subtotal_c?: number
  // Totales
  total_usd?: number
  total_local?: number
  created_at: string
}

export interface ImportacionProducto {
  id: string
  importacion_id: string
  producto_id: string
  cantidad: number
  costo_unitario?: number
  created_at: string
  importacion?: Importacion
  producto?: Producto
}

export interface CreateImportacionForm {
  carpeta_folio: string
  proveedor_id: string
  transportista: string
  arbitraje?: number
  tipo_cambio: number
  cantidad_bultos: number
  peso_total: number
  moneda_origen: 'EUR' | 'USD' | 'UYU'
  fecha_importacion: string
  costos: Partial<ImportacionCostos>
  productos: {
    producto_id: string
    cantidad: number
    costo_unitario?: number
  }[]
}
