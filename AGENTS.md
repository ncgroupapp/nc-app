# AGENTS.md - Coding Standards

Gentleman Guardian Angel v2.8.1 - Frontend Coding Standards

> **Project**: Corna App - Sistema de Gestión de Licitaciones
> **Stack**: Next.js 16, React 19, TypeScript, shadcn/ui, Tailwind CSS v4, Zustand, Zod
> **Language**: Spanish (UI) / English (code/comments)

---

## Table of Contents

1. [TypeScript Standards](#typescript-standards)
2. [React & Next.js Patterns](#react--nextjs-patterns)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [Styling (Tailwind CSS v4)](#styling-tailwind-css-v4)
6. [Form Validation](#form-validation)
7. [Error Handling](#error-handling)
8. [Performance](#performance)
9. [Security](#security)
10. [Testing](#testing)
11. [Naming Conventions](#naming-conventions)
12. [File Organization](#file-organization)

---

## TypeScript Standards

### Type Safety First

```typescript
// ✅ GOOD - Explicit types for function signatures
type ProductStatus = 'active' | 'inactive' | 'discontinued'

interface Product {
  id: string
  name: string
  sku: string
  status: ProductStatus
  price: number
  createdAt: Date
}

function updateProductStatus(product: Product, status: ProductStatus): Product {
  return { ...product, status }
}

// ❌ BAD - Using any excessively
function updateProduct(product: any, status: any) {
  return { ...product, status }
}
```

### Discriminated Unions

```typescript
// ✅ GOOD - Discriminated unions for state
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

function useProduct(id: string): AsyncState<Product> {
  // ...
}
```

### Strict Mode Rules

- **Never use `any`** unless absolutely necessary (and justify in comments)
- **Prefer `unknown` over `any`** when type cannot be determined
- **Use `readonly`** for arrays that shouldn't be reassigned
- **Use `as const`** for literal types

```typescript
// ✅ GOOD
const LICITATION_STATUSES = [
  'En espera',
  'Adjudicación Parcial',
  'No Adjudicada',
  'Adjudicación Total',
] as const

type LicitationStatus = typeof LICITATION_STATUSES[number]
```

---

## React & Next.js Patterns

### App Router Conventions

```typescript
// ✅ GOOD - Server Components by default
export default async function ProductsPage() {
  const products = await productsService.getAll()
  return <ProductsList products={products} />
}

// ✅ GOOD - Client Components with 'use client' directive at TOP
'use client'

export function ProductForm({ onSubmit }: ProductFormProps) {
  // ...
}
```

### Server Actions

```typescript
// ✅ GOOD - Server actions in actions directory
'use server'

import { revalidatePath } from 'next/cache'
import { productsService } from '@/services/products.service'

export async function deleteProduct(id: string) {
  try {
    await productsService.delete(id)
    revalidatePath('/dashboard/productos')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete product' }
  }
}
```

### Suspense & Loading States

```typescript
// ✅ GOOD - Use Suspense boundaries
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <ProductDetail id={params.id} />
    </Suspense>
  )
}
```

### Hooks Usage

```typescript
// ✅ GOOD - Custom hooks for reusable logic
function useLicitations(filters?: LicitationFilters) {
  const [state, setState] = useState<AsyncState<Licitation[]>>({ status: 'idle' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState({ status: 'loading' })
      try {
        const data = await licitacionesService.getAll(filters)
        if (!cancelled) setState({ status: 'success', data })
      } catch (error) {
        if (!cancelled) setState({ status: 'error', error: error as Error })
      }
    }

    load()
    return () => { cancelled = true }
  }, [filters])

  return state
}
```

---

## Component Architecture

### Component Structure

```typescript
// ✅ GOOD - Clear component structure
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ProductFormProps {
  product?: Product
  onSubmit: (data: ProductFormData) => void
  onCancel?: () => void
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  // 1. Hooks
  const [formData, setFormData] = useState<ProductFormData>(() =>
    product ? mapToFormData(product) : getInitialFormData()
  )

  // 2. Derived values
  const isValid = validateForm(formData)

  // 3. Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) onSubmit(formData)
  }

  // 4. Effects (if needed)
  useEffect(() => {
    if (product) setFormData(mapToFormData(product))
  }, [product])

  // 5. Render
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* JSX */}
    </form>
  )
}
```

### Component Types

```typescript
// ✅ GOOD - Props interfaces
interface ProductCardProps {
  product: Product
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  variant?: 'compact' | 'detailed'
}

// ✅ GOOD - Explicit default props
ProductCard.defaultProps = {
  variant: 'detailed',
}
```

### Compound Components

```typescript
// ✅ GOOD - Compound components pattern for complex UI
interface DataTableProps {
  data: unknown[]
  columns: Column[]
}

const DataTable = ({ data, columns }: DataTableProps) => { /* ... */ }

DataTable.Header = ({ children }: { children: React.ReactNode }) => { /* ... */ }
DataTable.Body = ({ children }: { children: React.ReactNode }) => { /* ... */ }
DataTable.Row = ({ children }: { children: React.ReactNode }) => { /* ... */ }
DataTable.Cell = ({ children }: { children: React.ReactNode }) => { /* ... */ }

// Usage
<DataTable data={products} columns={columns}>
  <DataTable.Header>
    <DataTable.Row>
      <DataTable.Cell>Name</DataTable.Cell>
    </DataTable.Row>
  </DataTable.Header>
  <DataTable.Body>
    {/* ... */}
  </DataTable.Body>
</DataTable>
```

---

## State Management

### Zustand Store Pattern

```typescript
// ✅ GOOD - Zustand store with TypeScript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface ProductsStore {
  // State
  products: Product[]
  selectedProduct: Product | null
  filters: ProductFilters
  isLoading: boolean

  // Actions
  setProducts: (products: Product[]) => void
  setSelectedProduct: (product: Product | null) => void
  setFilters: (filters: Partial<ProductFilters>) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
}

export const useProductsStore = create<ProductsStore>()(
  immer((set) => ({
    products: [],
    selectedProduct: null,
    filters: {},
    isLoading: false,

    setProducts: (products) => set({ products }),

    setSelectedProduct: (product) => set({ selectedProduct: product }),

    setFilters: (filters) => set((state) => {
      state.filters = { ...state.filters, ...filters }
    }),

    updateProduct: (id, updates) => set((state) => {
      const index = state.products.findIndex(p => p.id === id)
      if (index !== -1) {
        Object.assign(state.products[index], updates)
      }
    }),
  }))
)
```

### Local vs Global State

```typescript
// ✅ GOOD - Use local state for component-specific data
function ProductCard({ product }: { product: Product }) {
  const [isExpanded, setIsExpanded] = useState(false) // Local state
  return <div>...</div>
}

// ✅ GOOD - Use Zustand for shared/app-wide state
function ProductList() {
  const { products, filters, setFilters } = useProductsStore() // Global state
  return <div>...</div>
}
```

---

## Styling (Tailwind CSS v4)

### Tailwind v4 Patterns

```typescript
// ✅ GOOD - Utility-first, consistent spacing
<div className="flex items-center justify-between gap-4 p-4 border-b">
  {/* Content */}
</div>

// ✅ GOOD - Responsive design with breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Grid items */}
</div>

// ✅ GOOD - Hover and focus states
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click me
</button>

// ❌ BAD - Arbitrary values without good reason
<div className="top-[23px] left-[47px] p-[7px]">
```

### Color Consistency

```typescript
// ✅ GOOD - Use Tailwind color scale
<div className="bg-blue-500 text-white" />
<div className="bg-blue-100 text-blue-900" />
<div className="border-zinc-200" />

// ✅ GOOD - Semantic colors for status
const statusVariants = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
} as const
```

### Spacing Scale

```typescript
// ✅ GOOD - Consistent spacing using Tailwind scale
// 4px increments: 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px)
<div className="p-4 m-2 gap-4 space-y-4" />

// ❌ BAD - Inconsistent spacing
<div className="p-[13px] m-[7px] gap-[19px]" />
```

---

## Form Validation

### Zod + React Hook Form

```typescript
// ✅ GOOD - Zod schema with detailed validation
import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  sku: z.string().min(1, 'El SKU es requerido').regex(/^[A-Z0-9-]+$/, 'SKU inválido'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  stock: z.number().int().min(0, 'El stock debe ser un número entero positivo'),
  status: z.enum(['active', 'inactive', 'discontinued']),
  categoryId: z.string().uuid('ID de categoría inválido'),
}).refine(
  (data) => !(data.price > 0 && data.stock === 0),
  { message: 'Producto con precio debe tener stock disponible', path: ['stock'] }
)

export type ProductFormData = z.infer<typeof productSchema>

// ✅ GOOD - React Hook Form integration
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

function ProductForm({ product, onSubmit }: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          status: product.status,
          categoryId: product.categoryId,
        }
      : undefined,
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

---

## Error Handling

### Error Boundaries

```typescript
// ✅ GOOD - Error boundary for component trees
'use client'

import { Component, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert variant="destructive">
          <AlertDescription>
            {this.state.error?.message || 'Ha ocurrido un error'}
          </AlertDescription>
        </Alert>
      )
    }
    return this.props.children
  }
}
```

### Async Error Handling

```typescript
// ✅ GOOD - Try-catch with user feedback
async function handleDelete(id: string) {
  try {
    setIsLoading(true)
    await productsService.delete(id)
    toast.success('Producto eliminado exitosamente')
    onDeleted(id)
  } catch (error) {
    console.error('Delete error:', error)
    toast.error(error instanceof Error ? error.message : 'Error al eliminar producto')
  } finally {
    setIsLoading(false)
  }
}
```

---

## Performance

### Memoization

```typescript
// ✅ GOOD - useMemo for expensive calculations
const filteredProducts = useMemo(() =>
  products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'all' || p.status === statusFilter)
  ),
  [products, search, statusFilter]
)

// ✅ GOOD - useCallback for event handlers passed to children
const handleEdit = useCallback((id: string) => {
  setSelectedProduct(products.find(p => p.id === id))
}, [products])

// ❌ BAD - Unnecessary memoization
const simpleValue = useMemo(() => products.length, [products.length])
```

### Code Splitting

```typescript
// ✅ GOOD - Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
})

// ✅ GOOD - Route-based code splitting (automatic with Next.js App Router)
```

### Image Optimization

```typescript
// ✅ GOOD - Next.js Image component
import Image from 'next/image'

<Image
  src="/product-image.jpg"
  alt="Producto"
  width={400}
  height={300}
  priority // Above the fold
  sizes="(max-width: 768px) 100vw, 400px"
/>
```

---

## Security

### XSS Prevention

```typescript
// ✅ GOOD - React escapes content by default
<div>{userInput}</div> {/* Safe */}

// ❌ BAD - Using dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} /> {/* Unsafe */}

// ✅ GOOD - If necessary, sanitize first
import DOMPurify from 'dompurify'

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### Environment Variables

```typescript
// ✅ GOOD - Public env variables (prefixed with NEXT_PUBLIC_)
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// ✅ GOOD - Server-side only env variables (not exposed to client)
// in server component or server action
const dbUrl = process.env.DATABASE_URL // Only on server
```

---

## Testing

### Component Testing Pattern

```typescript
// ✅ GOOD - Component test with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductForm } from './product-form'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('ProductForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields', () => {
    render(<ProductForm onSubmit={mockOnSubmit} />)
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sku/i)).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<ProductForm onSubmit={mockOnSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument()
    })
  })

  it('submits valid form data', async () => {
    render(<ProductForm onSubmit={mockOnSubmit} />)

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Test Product' },
    })
    fireEvent.change(screen.getByLabelText(/sku/i), {
      target: { value: 'TEST-001' },
    })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Product',
          sku: 'TEST-001',
        })
      )
    })
  })
})
```

---

## Naming Conventions

### File Names

- **Components**: `PascalCase.tsx` → `ProductCard.tsx`, `DataTable.tsx`
- **Pages**: `lowercase.tsx` → `page.tsx`, `layout.tsx`
- **Utilities**: `camelCase.ts` → `formatCurrency.ts`, `validators.ts`
- **Types**: `*.types.ts` → `product.types.ts`
- **Constants**: `UPPER_CASE.ts` → `API_ENDPOINTS.ts`

### Variable/Function Names

```typescript
// ✅ GOOD - camelCase for variables and functions
const productId = '123'
const handleDelete = () => {}
const formatCurrency = (amount: number) => {}

// ✅ GOOD - PascalCase for types and interfaces
type ProductStatus = 'active' | 'inactive'
interface ProductFormData { }

// ✅ GOOD - UPPER_CASE for constants
const API_BASE_URL = 'https://api.example.com'
const MAX_RETRY_COUNT = 3
```

### Component Names

```typescript
// ✅ GOOD - Descriptive, domain-specific names
<ProductCard />
<LicitationStatusBadge />
<QuotationItemForm />

// ❌ BAD - Generic names
<Card />
<Badge />
<Form />
```

---

## File Organization

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── dashboard/                 # Route group
│   │   ├── productos/
│   │   │   ├── [id]/
│   │   │   │   ├── components/    # Page-specific components
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── common/                   # Shared domain-agnostic components
│   │   ├── page-header.tsx
│   │   ├── data-view.tsx
│   │   └── detail-card.tsx
│   └── [domain]/                 # Domain-specific components
│       ├── productos/
│       └── clientes/
├── lib/                          # Utilities
│   ├── supabase.ts
│   ├── utils.ts
│   └── validators.ts
├── services/                     # API/data services
│   ├── products.service.ts
│   └── licitaciones.service.ts
├── stores/                       # Zustand stores
│   ├── products.ts
│   └── ui.ts
├── types/                        # Shared types
│   └── index.ts
└── styles/                       # Global styles
    └── globals.css
```

### Import Order

```typescript
// ✅ GOOD - Consistent import order
// 1. React/core
import { useState, useEffect } from 'react'
import Link from 'next/link'

// 2. External libraries
import { z } from 'zod'
import { toast } from 'sonner'

// 3. Internal UI components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 4. Domain components
import { ProductCard } from '@/components/productos/product-card'

// 5. Services and stores
import { productsService } from '@/services/products.service'
import { useProductsStore } from '@/stores/products'

// 6. Types
import type { Product } from '@/types'

// 7. Styles (if needed)
import styles from './product-list.module.css'
```

---

## Quick Reference

### Must-Do Checklist Before Commit

- [ ] No `any` types (or documented exceptions)
- [ ] All forms use Zod validation
- [ ] Error handling with user feedback
- [ ] Loading states for async operations
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] No console.log in production code
- [ ] Environment variables properly typed

### ESLint Rules (Active)

- `@typescript-eslint/no-explicit-any`: warn
- Next.js core-web-vitals & typescript presets enabled

---

**Version**: 2.8.1
**Last Updated**: 2026-04-03
**Maintainer**: Corna App Team
