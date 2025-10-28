export interface Proveedor {
  id: string
  nombre: string
  pais: string
  contacto: string
  email?: string
  telefono?: string
  direccion?: string
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  nombre: string
  identificador: string
  email?: string
  telefono?: string
  direccion?: string
  created_at: string
  updated_at: string
}

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

export interface Licitacion {
  id: string
  fecha_inicio: string
  fecha_limite: string
  cliente_id: string
  numero_llamado: string
  numero_interno: string
  estado: 'En espera' | 'Adjudicación Parcial' | 'No Adjudicada' | 'Adjudicación Total'
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

export interface HistoricoGanador {
  id: string
  producto_id: string
  licitacion_id: string
  nombre_ganador: string
  monto_adjudicado?: number
  fecha_adjudicacion: string
  created_at: string
  producto?: Producto
  licitacion?: Licitacion
}

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

// Form types
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

export interface CreateProveedorForm {
  nombre: string
  pais: string
  contacto: string
  email?: string
  telefono?: string
  direccion?: string
}

export interface CreateClienteForm {
  nombre: string
  identificador: string
  email?: string
  telefono?: string
  direccion?: string
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

export interface CreateOfertaForm {
  producto_id: string
  proveedor_id: string
  precio: number
  fecha_entrega: string
  cantidad: number
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

// Dashboard types
export interface DashboardStats {
  totalLicitaciones: number
  licitacionesActivas: number
  totalProductos: number
  bajoStock: number
  totalProveedores: number
  totalClientes: number
  adjudicacionesMes: number
  entregasPendientes: number
}

export interface StockAlert {
  producto_id: string
  producto_nombre: string
  sku: string
  stock_actual: number
  stock_minimo: number
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Table column definitions
export interface TableColumn<T> {
  key: keyof T
  title: string
  sortable?: boolean
  width?: string
  render?: (value: T[keyof T], record: T) => React.ReactNode
}

// Filter types
export interface FilterOption {
  label: string
  value: string
}

export interface DateRange {
  start: string
  end: string
}