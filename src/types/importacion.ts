import { Proveedor } from './proveedor';
import { Producto } from './producto';
import { Licitacion } from './licitacion';

// Backend Response Type (camelCase English) - this IS the main type
export interface Importacion {
  id: number
  folder: string
  providerId: number
  transport: string
  arbitrage: string
  exchangeRate: string | number
  packageCount: number
  totalWeight: string | number
  originCurrency: string
  importDate: string
  status: string
  fobOrigin: string | number
  fobUsd: string | number
  freightOrigin: string | number
  freightUsd: string | number
  insuranceOrigin: string | number
  insuranceUsd: string | number
  cif: string | number
  advanceVatRate: string | number
  advanceVat: string | number
  transitGuideRate: string | number
  transitGuide: string | number
  imaduniRate: string | number
  imaduni: string | number
  vatRate: string | number
  vat: string | number
  surchargeRate: string | number
  surcharge: string | number
  consularFeesRate: string | number
  consularFees: string | number
  tcuRate: string | number
  tcu: string | number
  auriStampsRate: string | number
  auriStamps: string | number
  tsaRate: string | number
  tsa: string | number
  bankCharges: string | number
  subtotalA: string | number
  otherExemptPayments?: { otros_pagos_exentos: number }
  subtotalB: string | number
  dispatchExpensesRate: string | number
  dispatchExpenses: string | number
  customsSurchargeRate: string | number
  customsSurcharge: string | number
  feesRate: string | number
  fees: string | number
  externalFreightRate: string | number
  externalFreight: string | number
  insuranceTaxRate: string | number
  insuranceTax: string | number
  internalFreightRate: string | number
  internalFreight: string | number
  vatSubject: string | number
  subtotalC: string | number
  createdAt: string
  updatedAt: string
  provider?: Proveedor
  products?: Producto[]
  licitations?: Licitacion[]
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
  folder: string
  providerId: number | string
  transport: string
  arbitrage?: string
  exchangeRate: number | string
  packageCount: number
  totalWeight: number | string
  originCurrency: 'EUR' | 'USD' | 'UYU'
  importDate: string
  status?: string
  // Costs as flat structure (like backend)
  fobOrigin?: number | string
  fobUsd?: number | string
  freightOrigin?: number | string
  freightUsd?: number | string
  insuranceOrigin?: number | string
  insuranceUsd?: number | string
  advanceVatRate: number | string
  transitGuideRate: number | string
  imaduniRate: number | string
  vatRate: number | string
  surchargeRate: number | string
  consularFeesRate: number | string
  tcuRate: number | string
  auriStampsRate: number | string
  tsaRate: number | string
  bankCharges: number | string
  otherExemptPayments?: { otros_pagos_exentos: number }
  dispatchExpensesRate: number | string
  customsSurchargeRate: number | string
  feesRate: number | string
  externalFreightRate: number | string
  insuranceTaxRate: number | string
  internalFreightRate: number | string
  // Products
  productIds: (string | number)[]
  licitationIds?: (string | number)[]
}
