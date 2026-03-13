'use client'

import { FadeIn } from '@/components/common/fade-in'
import { SearchInput } from '@/components/common/search-input'
import { OfferForm } from '@/components/ofertas/offer-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MultiSelectSearch } from '@/components/ui/multi-select-search'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/hooks/use-confirm'
import { useDebounce } from '@/hooks/use-debounce'
import { CreateOfferDto, Offer, offersService } from '@/services/offers.service'
import { Product, productsService } from '@/services/products.service'
import { proveedoresService } from '@/services/proveedores.service'
import { Proveedor } from '@/types'
import {
  Calendar,
  Edit,
  Package,
  Plus,
  Search,
  Trash2,
  Users
} from "lucide-react"
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function OfertasPage() {
  const { confirm } = useConfirm()
  const [ofertas, setOfertas] = useState<Offer[]>([])
  const [productos, setProductos] = useState<Product[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [selectedProviders, setSelectedProviders] = useState<number[]>([])
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })

  const [productSearch, setProductSearch] = useState('')
  const debouncedProductSearch = useDebounce(productSearch, 300)

  const [providerSearch, setProviderSearch] = useState('')
  const debouncedProviderSearch = useDebounce(providerSearch, 300)

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)

  const fetchOffers = async (page: number) => {
    try {
      setLoading(true)
      const filters = {
        page,
        limit: pagination.limit,
        search: debouncedSearchTerm,
        productId: selectedProducts.length > 0 ? selectedProducts : undefined,
        providerId: selectedProviders.length > 0 ? selectedProviders : undefined,
      }
      const ofertasRes = await offersService.getAll(filters)
      setOfertas(ofertasRes.data || [])
      if (ofertasRes.meta) {
        setPagination({
          page: ofertasRes.meta.page,
          limit: ofertasRes.meta.limit,
          total: ofertasRes.meta.total,
          totalPages: ofertasRes.meta.lastPage
        })
      }
    } catch (err) {
      console.error('Error loading data:', err)
      toast.error("Error", {
        description: "Error al cargar los datos. Por favor, intente nuevamente."
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOffers(1)
  }, [debouncedSearchTerm, selectedProducts, selectedProviders])

  // Dynamically load products for filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const isSearching = debouncedProductSearch.trim().length > 0;
        const productsRes = await productsService.getAll({ 
          search: isSearching ? debouncedProductSearch : undefined, 
          limit: isSearching ? 20 : 5 
        });
        setProductos(productsRes.data || []);
      } catch (err) {
        console.error("Error loading products:", err);
      }
    };
    fetchProducts();
  }, [debouncedProductSearch]);

  // Dynamically load providers for filters
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const isSearching = debouncedProviderSearch.trim().length > 0;
        const providersRes = await proveedoresService.getAll({ 
          search: isSearching ? debouncedProviderSearch : undefined, 
          limit: isSearching ? 20 : 5 
        });
        setProveedores(providersRes.data || []);
      } catch (err) {
        console.error("Error loading providers:", err);
      }
    };
    fetchProviders();
  }, [debouncedProviderSearch]);

  const handleSubmit = async (data: CreateOfferDto) => {
    try {
      setSubmitting(true)
      if (editingOffer) {
        await offersService.update(editingOffer.id, data)
        toast.success("Éxito", {
          description: "Oferta actualizada correctamente",
        })
      } else {
        await offersService.create(data)
        toast.success("Éxito", {
          description: "Oferta creada correctamente",
        })
      }
      setIsDialogOpen(false)
      fetchOffers(pagination.page)
    } catch (err) {
      console.error('Error saving offer:', err)
      toast.error("Error", {
        description: "Error al guardar la oferta. Verifique los datos.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingOffer(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (offer: Offer) => {
    setEditingOffer(offer)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!await confirm({
      title: 'Eliminar Oferta',
      message: '¿Está seguro de eliminar esta oferta?',
      variant: 'destructive'
    })) return

    try {
      await offersService.delete(id)
      toast.success("Éxito", {
        description: "Oferta eliminada correctamente",
      })
      fetchOffers(pagination.page)
    } catch (err) {
      console.error('Error deleting offer:', err)
      toast.error("Error", {
        description: "Error al eliminar la oferta",
      })
    }
  }

  const columns: DataTableColumn<Offer>[] = [
    {
      key: "id",
      header: "ID",
      accessorKey: "id",
      className: "w-12 text-center text-sm text-muted-foreground",
    },
    {
      key: "name",
      header: "Nombre CD",
      accessorKey: "name",
      className: "font-medium",
    },
    {
      key: "productName",
      header: "Producto",
      render: (row) => row.product?.name,
    },
    {
      key: "providerName",
      header: "Proveedor",
      render: (row) => row.provider?.name,
    },
    { key: "quantity", header: "Cantidad", accessorKey: "quantity" },
    {
      key: "price",
      header: "Precio Unit. (IVA)",
      render: (row) => `$${Number(row.price).toFixed(2)}`,
    },
    {
      key: "total",
      header: "Total (IVA)",
      render: (row) =>
        `$${(Number(row.price) * Number(row.quantity)).toFixed(2)}`,
      className: "font-bold",
    },
    {
      key: "delivery",
      header: "Entrega (días)",
      render: (row) => (
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-3 w-3" />
          {row.delivery
            ? `${row.delivery} día${row.delivery > 1 ? "s" : ""}`
            : "-"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn direction="none">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gestión de Ofertas
            </h1>
            <p className="text-muted-foreground">
              Registro y gestión de ofertas de proveedores (Compra Directa)
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Oferta
          </Button>
        </div>
      </FadeIn>

      <div className="grid gap-4 md:grid-cols-3">
        <FadeIn delay={100}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Ofertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-12 pt-1">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="text-2xl font-bold">{ofertas.length}</div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={200}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Productos Ofertados
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-12 pt-1">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="text-2xl font-bold">
                  {new Set(ofertas.map((o) => o.productId)).size}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={300}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Proveedores Activos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-12 pt-1">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="text-2xl font-bold">
                  {new Set(ofertas.map((o) => o.providerId)).size}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={400}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <SearchInput
                  placeholder="Buscar por nombre, producto, codigo y marca del producto o proveedor..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </div>
              <div className="w-full md:w-64">
                <MultiSelectSearch
                  options={productos.map((prod) => ({
                    id: prod.id,
                    label: prod.name,
                  }))}
                  selectedValues={selectedProducts}
                  onSelect={(id) =>
                    setSelectedProducts((prev) => {
                      const numId = Number(id);
                      return prev.includes(numId) ? prev : [...prev, numId];
                    })
                  }
                  onRemove={(id) =>
                    setSelectedProducts((prev) =>
                      prev.filter((p) => p !== Number(id)),
                    )
                  }
                  placeholder="Filtrar por Producto/s"
                  searchPlaceholder="Buscar producto..."
                  searchValue={productSearch}
                  onSearchValueChange={setProductSearch}
                  shouldFilter={false}
                  single={false}
                />
              </div>
              <div className="w-full md:w-64">
                <MultiSelectSearch
                  options={proveedores.map((prov) => ({
                    id: prov.id,
                    label: prov.name,
                  }))}
                  selectedValues={selectedProviders}
                  onSelect={(id) =>
                    setSelectedProviders((prev) => {
                      const numId = Number(id);
                      return prev.includes(numId) ? prev : [...prev, numId];
                    })
                  }
                  onRemove={(id) =>
                    setSelectedProviders((prev) =>
                      prev.filter((p) => p !== Number(id)),
                    )
                  }
                  placeholder="Filtrar por Proveedor/es"
                  searchPlaceholder="Buscar proveedor..."
                  searchValue={providerSearch}
                  onSearchValueChange={setProviderSearch}
                  shouldFilter={false}
                  single={false}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={500}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Listado de Ofertas</span>
              <Badge variant="outline">
                {ofertas.length} {ofertas.length === 1 ? "oferta" : "ofertas"}
              </Badge>
            </CardTitle>
            <CardDescription>Historial de ofertas recibidas</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={ofertas}
              isLoading={loading}
              pagination={{
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.totalPages,
                onPageChange: fetchOffers,
              }}
              emptyMessage="No hay ofertas registradas que coincidan con los filtros."
            />
          </CardContent>
        </Card>
      </FadeIn>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? "Editar Oferta" : "Nueva Oferta"}
            </DialogTitle>
            <DialogDescription>
              Complete los detalles de la oferta. Todos los campos marcados con
              * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <OfferForm 
            initialData={editingOffer}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            isLoading={submitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
