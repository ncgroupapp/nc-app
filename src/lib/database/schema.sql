-- Schema del Sistema de Gestión de Licitaciones

-- Tabla de Proveedores
CREATE TABLE proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  pais VARCHAR(100) NOT NULL,
  contacto VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(50),
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Clientes
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  identificador VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255),
  telefono VARCHAR(50),
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Contactos de Clientes
CREATE TABLE contactos_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(50),
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Productos
CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  imagen TEXT,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE RESTRICT,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  cantidad_stock INTEGER NOT NULL DEFAULT 0,
  detalles TEXT,
  observaciones TEXT,
  chasis VARCHAR(100),
  motor VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Ofertas
CREATE TABLE ofertas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE RESTRICT,
  precio DECIMAL(12,2) NOT NULL,
  fecha_entrega DATE NOT NULL,
  cantidad INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Licitaciones
CREATE TABLE licitaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha_inicio DATE NOT NULL,
  fecha_limite DATE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
  numero_llamado VARCHAR(100) NOT NULL,
  numero_interno VARCHAR(100) NOT NULL,
  estado VARCHAR(50) DEFAULT 'En espera' CHECK (estado IN ('En espera', 'Adjudicación Parcial', 'No Adjudicada', 'Adjudicación Total')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Productos de Licitación
CREATE TABLE licitacion_productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  licitacion_id UUID REFERENCES licitaciones(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad_solicitada INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Cotizaciones
CREATE TABLE cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  licitacion_id UUID REFERENCES licitaciones(id) ON DELETE CASCADE,
  estado VARCHAR(50) DEFAULT 'Creada' CHECK (estado IN ('Creada', 'Finalizada')),
  fecha_envio TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Productos de Cotización
CREATE TABLE cotizacion_productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE RESTRICT,
  sku VARCHAR(100) NOT NULL,
  plazo_entrega INTEGER, -- Días hábiles
  precio_unitario DECIMAL(12,2) NOT NULL,
  precio_con_iva DECIMAL(12,2) NOT NULL,
  precio_sin_iva DECIMAL(12,2) NOT NULL,
  iva_incluido BOOLEAN DEFAULT false,
  estado VARCHAR(50) DEFAULT 'En espera' CHECK (estado IN ('Adjudicado', 'Adjudicación Parcial', 'No Adjudicado', 'En espera')),
  es_stock BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Adjudicaciones
CREATE TABLE adjudicaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE,
  licitacion_id UUID REFERENCES licitaciones(id) ON DELETE RESTRICT,
  estado VARCHAR(50) NOT NULL CHECK (estado IN ('Adj Total', 'Parcial')),
  cantidad_total INTEGER NOT NULL,
  precio_total_sin_iva DECIMAL(12,2) NOT NULL,
  precio_total_con_iva DECIMAL(12,2) NOT NULL,
  fecha_adjudicacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Productos Adjudicados
CREATE TABLE adjudicacion_productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  adjudicacion_id UUID REFERENCES adjudicaciones(id) ON DELETE CASCADE,
  cotizacion_producto_id UUID REFERENCES cotizacion_productos(id) ON DELETE RESTRICT,
  sku VARCHAR(100) NOT NULL,
  cantidad_adjudicada INTEGER NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Entregas
CREATE TABLE entregas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  adjudicacion_id UUID REFERENCES adjudicaciones(id) ON DELETE RESTRICT,
  licitacion_id UUID REFERENCES licitaciones(id) ON DELETE RESTRICT,
  estado VARCHAR(50) DEFAULT 'Pendiente de Entrega' CHECK (estado IN ('Pendiente de Entrega', 'En Camino', 'Entregado', 'Problema en Entrega')),
  fecha_entrega_estimada DATE NOT NULL,
  fecha_entrega_real DATE,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Productos de Entrega
CREATE TABLE entrega_productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entrega_id UUID REFERENCES entregas(id) ON DELETE CASCADE,
  adjudicacion_producto_id UUID REFERENCES adjudicacion_productos(id) ON DELETE RESTRICT,
  sku VARCHAR(100) NOT NULL,
  cantidad INTEGER NOT NULL,
  estado_entrega VARCHAR(50) DEFAULT 'Pendiente de Entrega',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Facturas
CREATE TABLE facturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entrega_id UUID REFERENCES entregas(id) ON DELETE RESTRICT,
  numero_factura VARCHAR(100) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha_emision DATE NOT NULL,
  archivo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Histórico de Ganadores
CREATE TABLE historico_ganadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
  licitacion_id UUID REFERENCES licitaciones(id) ON DELETE RESTRICT,
  nombre_ganador VARCHAR(255) NOT NULL,
  monto_adjudicado DECIMAL(12,2),
  fecha_adjudicacion DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Importaciones
CREATE TABLE importaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carpeta_folio VARCHAR(100) NOT NULL,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE RESTRICT,
  transportista VARCHAR(255) NOT NULL,
  arbitraje DECIMAL(12,2),
  tipo_cambio DECIMAL(12,4) NOT NULL,
  cantidad_bultos INTEGER NOT NULL,
  peso_total DECIMAL(10,2) NOT NULL,
  moneda_origen VARCHAR(10) NOT NULL CHECK (moneda_origen IN ('EUR', 'USD', 'UYU')),
  fecha_importacion DATE NOT NULL,
  estado VARCHAR(50) DEFAULT 'En Tránsito' CHECK (estado IN ('En Tránsito', 'En Aduana', 'Liberada', 'Entregada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Costos de Importación
CREATE TABLE importacion_costos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  importacion_id UUID REFERENCES importaciones(id) ON DELETE CASCADE,

  -- Costos Base
  fob DECIMAL(12,2),
  flete DECIMAL(12,2),
  seguro DECIMAL(12,2),
  cif DECIMAL(12,2),

  -- Tributos Oficiales Exentos de IVA
  adelanto_iva DECIMAL(12,2),
  guia_transito DECIMAL(12,2),
  imaduni DECIMAL(12,2),
  iva DECIMAL(12,2),
  recargo DECIMAL(12,2),
  tasas_consulares DECIMAL(12,2),
  tcu DECIMAL(12,2),
  timbres_auri DECIMAL(12,2),
  tsa DECIMAL(12,2),
  gastos_bancarios DECIMAL(12,2),
  subtotal_a DECIMAL(12,2),

  -- Otros Pagos Exentos de IVA
  otros_pagos_exentos DECIMAL(12,2),
  subtotal_b DECIMAL(12,2),

  -- Pagos Gravados de IVA
  gastos_despacho DECIMAL(12,2),
  sobre_aduanero DECIMAL(12,2),
  honorarios DECIMAL(12,2),
  flete_externo DECIMAL(12,2),
  seguro_gravado DECIMAL(12,2),
  flete_interno DECIMAL(12,2),
  iva_gravados DECIMAL(12,2),
  subtotal_c DECIMAL(12,2),

  -- Totales
  total_usd DECIMAL(12,2),
  total_local DECIMAL(12,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Productos de Importación
CREATE TABLE importacion_productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  importacion_id UUID REFERENCES importaciones(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL,
  costo_unitario DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Relación Importación-Licitación
CREATE TABLE importacion_licitaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  importacion_id UUID REFERENCES importaciones(id) ON DELETE CASCADE,
  licitacion_id UUID REFERENCES licitaciones(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX idx_licitaciones_estado ON licitaciones(estado);
CREATE INDEX idx_cotizaciones_licitacion ON cotizaciones(licitacion_id);
CREATE INDEX idx_cotizacion_productos_cotizacion ON cotizacion_productos(cotizacion_id);
CREATE INDEX idx_adjudicaciones_cotizacion ON adjudicaciones(cotizacion_id);
CREATE INDEX idx_entregas_adjudicacion ON entregas(adjudicacion_id);
CREATE INDEX idx_ofertas_producto ON ofertas(producto_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ofertas_updated_at BEFORE UPDATE ON ofertas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_licitaciones_updated_at BEFORE UPDATE ON licitaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cotizaciones_updated_at BEFORE UPDATE ON cotizaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cotizacion_productos_updated_at BEFORE UPDATE ON cotizacion_productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_adjudicaciones_updated_at BEFORE UPDATE ON adjudicaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entregas_updated_at BEFORE UPDATE ON entregas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_importaciones_updated_at BEFORE UPDATE ON importaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();