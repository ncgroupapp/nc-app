import { z } from 'zod'

// Esquema de validación para Proveedores
export const proveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  pais: z.string().min(1, 'El país es obligatorio'),
  contacto: z.string().min(1, 'El contacto es obligatorio'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional()
})

// Esquema de validación para Clientes
export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  identificador: z.string().min(1, 'El identificador/RUT es obligatorio'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional()
})

// Esquema de validación para Productos
export const productoSchema = z.object({
  sku: z.string().min(1, 'El SKU es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  imagen: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
  proveedor_id: z.string().min(1, 'El proveedor es obligatorio'),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  cantidad_stock: z.number().min(0, 'El stock debe ser mayor o igual a 0'),
  detalles: z.string().optional(),
  observaciones: z.string().optional(),
  chasis: z.string().optional(),
  motor: z.string().optional()
})

// Esquema de validación para Ofertas
export const ofertaSchema = z.object({
  producto_id: z.string().min(1, 'El producto es obligatorio'),
  proveedor_id: z.string().min(1, 'El proveedor es obligatorio'),
  precio: z.number().min(0, 'El precio debe ser mayor a 0'),
  fecha_entrega: z.string().min(1, 'La fecha de entrega es obligatoria'),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0')
})

// Esquema de validación para Licitaciones
export const licitacionSchema = z.object({
  fecha_inicio: z.string().min(1, 'La fecha de inicio es obligatoria'),
  fecha_limite: z.string().min(1, 'La fecha límite es obligatoria'),
  cliente_id: z.string().min(1, 'El cliente es obligatorio'),
  numero_llamado: z.string().min(1, 'El número de llamado es obligatorio'),
  numero_interno: z.string().min(1, 'El número interno es obligatorio'),
  productos: z.array(z.object({
    producto_id: z.string().min(1, 'El producto es obligatorio'),
    cantidad_solicitada: z.number().min(1, 'La cantidad debe ser mayor a 0')
  })).min(1, 'Debe agregar al menos un producto')
}).refine((data) => {
  const inicio = new Date(data.fecha_inicio)
  const limite = new Date(data.fecha_limite)
  return limite > inicio
}, {
  message: 'La fecha límite debe ser posterior a la fecha de inicio',
  path: ['fecha_limite']
})

// Esquema de validación para Productos de Cotización
export const cotizacionProductoSchema = z.object({
  producto_id: z.string().min(1, 'El producto es obligatorio'),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  proveedor_id: z.string().min(1, 'El proveedor es obligatorio'),
  sku: z.string().min(1, 'El SKU es obligatorio'),
  plazo_entrega: z.number().min(0, 'El plazo debe ser mayor o igual a 0').optional(),
  precio_unitario: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  precio_con_iva: z.number().min(0, 'El precio con IVA debe ser mayor o igual a 0'),
  precio_sin_iva: z.number().min(0, 'El precio sin IVA debe ser mayor o igual a 0'),
  iva_incluido: z.boolean().default(false),
  es_stock: z.boolean().default(false)
})

// Esquema de validación para Importaciones
export const importacionSchema = z.object({
  carpeta_folio: z.string().min(1, 'La carpeta/folio es obligatoria'),
  proveedor_id: z.string().min(1, 'El proveedor es obligatorio'),
  transportista: z.string().min(1, 'El transportista es obligatorio'),
  arbitraje: z.number().min(0, 'El arbitraje debe ser mayor o igual a 0').optional(),
  tipo_cambio: z.number().min(0, 'El tipo de cambio debe ser mayor a 0'),
  cantidad_bultos: z.number().min(1, 'La cantidad de bultos debe ser mayor a 0'),
  peso_total: z.number().min(0, 'El peso total debe ser mayor o igual a 0'),
  moneda_origen: z.enum(['EUR', 'USD', 'UYU']),
  fecha_importacion: z.string().min(1, 'La fecha de importación es obligatoria'),
  costos: z.object({
    // Costos Base
    fob: z.number().min(0, 'El FOB debe ser mayor o igual a 0').optional(),
    flete: z.number().min(0, 'El flete debe ser mayor o igual a 0').optional(),
    seguro: z.number().min(0, 'El seguro debe ser mayor o igual a 0').optional(),
    // Tributos Oficiales Exentos de IVA
    adelanto_iva: z.number().min(0, 'El adelanto de IVA debe ser mayor o igual a 0').optional(),
    guia_transito: z.number().min(0, 'La guía de tránsito debe ser mayor o igual a 0').optional(),
    imaduni: z.number().min(0, 'El IMADUNI debe ser mayor o igual a 0').optional(),
    iva: z.number().min(0, 'El IVA debe ser mayor o igual a 0').optional(),
    recargo: z.number().min(0, 'El recargo debe ser mayor o igual a 0').optional(),
    tasas_consulares: z.number().min(0, 'Las tasas consulares deben ser mayores o iguales a 0').optional(),
    tcu: z.number().min(0, 'El TCU debe ser mayor o igual a 0').optional(),
    timbres_auri: z.number().min(0, 'Los timbres AURI deben ser mayores o iguales a 0').optional(),
    tsa: z.number().min(0, 'El TSA debe ser mayor o igual a 0').optional(),
    gastos_bancarios: z.number().min(0, 'Los gastos bancarios deben ser mayores o iguales a 0').optional(),
    // Otros Pagos Exentos de IVA
    otros_pagos_exentos: z.number().min(0, 'Los otros pagos exentos deben ser mayores o iguales a 0').optional(),
    // Pagos Gravados de IVA
    gastos_despacho: z.number().min(0, 'Los gastos de despacho deben ser mayores o iguales a 0').optional(),
    sobre_aduanero: z.number().min(0, 'El sobre aduanero debe ser mayor o igual a 0').optional(),
    honorarios: z.number().min(0, 'Los honorarios deben ser mayores o iguales a 0').optional(),
    flete_externo: z.number().min(0, 'El flete externo debe ser mayor o igual a 0').optional(),
    seguro_gravado: z.number().min(0, 'El seguro gravado debe ser mayor o igual a 0').optional(),
    flete_interno: z.number().min(0, 'El flete interno debe ser mayor o igual a 0').optional()
  }),
  productos: z.array(z.object({
    producto_id: z.string().min(1, 'El producto es obligatorio'),
    cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
    costo_unitario: z.number().min(0, 'El costo unitario debe ser mayor o igual a 0').optional()
  })).min(1, 'Debe agregar al menos un producto')
})

// Esquema para filtros de búsqueda
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  estado: z.string().optional(),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
  proveedor_id: z.string().optional(),
  cliente_id: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
})

// Esquema para login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

// Esquema para registro
export const registerSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

// Tipos derivados de los esquemas
export type ProveedorForm = z.infer<typeof proveedorSchema>
export type ClienteForm = z.infer<typeof clienteSchema>
export type ProductoForm = z.infer<typeof productoSchema>
export type OfertaForm = z.infer<typeof ofertaSchema>
export type LicitacionForm = z.infer<typeof licitacionSchema>
export type CotizacionProductoForm = z.infer<typeof cotizacionProductoSchema>
export type ImportacionForm = z.infer<typeof importacionSchema>
export type SearchFilters = z.infer<typeof searchFiltersSchema>
export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>