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
