# Sistema de Gestión de Licitaciones

Sistema integral para la gestión completa del proceso de licitaciones, desde la recepción hasta la adjudicación y entrega de productos.

## 🚀 Características Principales

### Módulos Implementados

- **📦 Gestión de Productos**: ABM completo con control de stock y asociación a proveedores
- **👥 Gestión de Proveedores**: Registro y gestión de información de contacto
- **🏢 Gestión de Clientes**: Manejo de clientes públicos y privados
- **📋 Gestión de Licitaciones**: Ciclo completo con tabs de visualización
- **💰 Sistema de Cotizaciones**: Cálculos automáticos con IVA
- **⚖️ Gestión de Adjudicaciones**: Adjudicaciones parciales y totales
- **🚚 Sistema de Entregas**: Seguimiento de entregas y facturación
- **🚢 Gestión de Importaciones**: Cálculo completo de costos y tributos

## 🛠️ Tecnología

- **Frontend**: Next.js 15 con App Router
- **UI**: shadcn/ui + Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Validaciones**: Zod + React Hook Form
- **Estado**: Zustand
- **Tipado**: TypeScript

## 📋 Requisitos Funcionales

### RF-PROD-001: Gestión ABM de Productos
- ✅ SKU único obligatorio
- ✅ Control de stock con alertas visuales
- ✅ Asociación automática con proveedores
- ✅ Búsqueda y filtrado avanzado
- ✅ Campos: marca, modelo, chasis, motor, detalles, observaciones

### RF-PROV-001: Gestión ABM de Proveedores
- ✅ Información de contacto completa
- ✅ Validación de datos obligatorios
- ✅ Búsqueda por nombre, contacto, email
- ✅ Estadísticas por país

### RF-CLI-001: Gestión ABM de Clientes
- ✅ Identificador/RUT único
- ✅ Diferenciación entre empresa y gobierno
- ✅ Contacto completo (email, teléfono, dirección)

### RF-LIC-001: Creación de Licitación
- ✅ Formulario con validaciones
- ✅ Múltiples productos por licitación
- ✅ Validación de fechas (límite > inicio)
- ✅ Estados automáticos

### RF-LIC-002: Visualización en Tabs
- ✅ Información General
- ✅ Productos Solicitados
- ✅ Cotización con cálculos
- ✅ Entrega de Productos
- ✅ Historial de cambios

### RF-COT-001: Creación de Cotización
- ✅ Decisión de stock automática
- ✅ Cálculo de totales con IVA
- ✅ Manejo de estados por producto
- ✅ Generación de PDF (preparado)

## 🗄️ Estructura de Base de Datos

El sistema incluye un schema SQL completo con:

- **Relaciones**: Claves foráneas y restricciones de integridad
- **Índices**: Optimizados para rendimiento
- **Triggers**: Actualización automática de timestamps
- **Estados**: Validación de estados con CHECK constraints

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd sistema-licitaciones
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.local.example .env.local
```

Editar `.env.local` con:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

4. **Configurar base de datos**
```bash
# Ejecutar el schema en Supabase SQL Editor
# Usar el archivo: src/lib/database/schema.sql
```

5. **Iniciar desarrollo**
```bash
npm run dev
```

Acceder a `http://localhost:3000`

## 📁 Estructura del Proyecto

```
sistema-licitaciones/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/       # Layout del dashboard
│   │   │   ├── page.tsx       # Dashboard principal
│   │   │   ├── productos/     # Módulo de productos
│   │   │   ├── proveedores/   # Módulo de proveedores
│   │   │   ├── clientes/      # Módulo de clientes
│   │   │   ├── licitaciones/  # Módulo de licitaciones
│   │   │   └── layout.tsx     # Layout del dashboard
│   │   ├── page.tsx           # Landing page
│   │   └── layout.tsx         # Layout principal
│   ├── components/
│   │   ├── ui/                # Componentes shadcn/ui
│   │   └── layout/            # Layout components
│   ├── lib/
│   │   ├── database/          # Schema SQL
│   │   ├── validations/       # Esquemas Zod
│   │   ├── supabase.ts        # Config Supabase
│   │   └── utils.ts           # Utilidades
│   └── types/
│       └── index.ts           # Tipos TypeScript
```

## 🎨 Componentes UI Implementados

### shadcn/ui Utilizados
- ✅ **Table**: Listados con ordenamiento y filtros
- ✅ **Tabs**: Navegación en licitaciones
- ✅ **Form**: Formularios con validaciones
- ✅ **Dialog**: Modales de creación/edición
- ✅ **Select**: Dropdowns y selecciones
- ✅ **Input**: Controles de entrada
- ✅ **Button**: Acciones y navegación
- ✅ **Card**: Contenedores de información
- ✅ **Badge**: Estados y etiquetas
- ✅ **ScrollArea**: Sidebar scrollable

## 🔧 Funcionalidades por Módulo

### Dashboard
- 📊 Estadísticas en tiempo real
- 🔔 Alertas de stock bajo
- 📈 Métricas clave del negocio
- ⚡ Acciones rápidas

### Productos
- 🔍 Búsqueda avanzada por SKU, nombre, modelo
- 📊 Control visual de stock
- ⚠️ Alertas automáticas de bajo stock
- 📝 Historial de cotizaciones y adjudicaciones

### Proveedores
- 🌍 Gestión por país
- 📊 Estadísticas de contacto
- 🔗 Validación de productos asociados
- 📱 Información de contacto completa

### Clientes
- 🏢 Diferenciación público/privado
- 📋 Historial de licitaciones
- 🔍 Búsqueda por RUT o nombre
- 📱 Contacto completo

### Licitaciones
- 📊 Dashboard de estados
- 📋 Creación con múltiples productos
- 📈 Visualización con tabs
- ⏰ Control de fechas límite
- 🎯 Flujo completo de adjudicación

## 🚀 Próximos Pasos

### Módulos por Implementar
- [ ] **Cotizaciones**: CRUD completo con cálculos automáticos
- [ ] **Adjudicaciones**: Gestión de adjudicaciones parciales/totales
- [ ] **Entregas**: Seguimiento completo y facturación
- [ ] **Importaciones**: Sistema completo con cálculo de tributos
- [ ] **Reportes**: Dashboard analítico
- [ ] **Configuración**: Parámetros del sistema

### Mejoras Técnicas
- [ ] **Autenticación**: NextAuth.js completo
- [ ] **Real-time**: Supabase Realtime
- [ ] **PDF Generation**: JSPDF o similar
- [ ] **File Upload**: Manejo de documentos
- [ ] **Testing**: Unit y E2E tests
- [ ] **Deploy**: Configuración de producción

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- 📧 Email: support@sistema-licitaciones.com
- 📱 Teléfono: +598 9876 5432
- 💬 Discord: [Server Link]

---

**Desarrollado con ❤️ usando Next.js, shadcn/ui y Supabase**
