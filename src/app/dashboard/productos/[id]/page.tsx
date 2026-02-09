'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { productsService, Product } from '@/services/products.service'
import { cotizacionesService, Quotation } from '@/services/cotizaciones.service'
import { adjudicacionesService, ProductAdjudicationHistory } from '@/services/adjudicaciones.service'
import { ArrowLeft, Package, AlertTriangle, Building, Tag, Layers, Truck, DollarSign } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  // Handles potential array if catch-all route, though standard [id] is string
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id
  const id = parseInt(idParam as string)

  const [product, setProduct] = useState<Product | null>(null)
  const [quotationHistory, setQuotationHistory] = useState<Quotation[]>([])
  const [adjudicationHistory, setAdjudicationHistory] = useState<ProductAdjudicationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [productData, quotesData, adjData] = await Promise.all([
          productsService.getById(id),
          cotizacionesService.getByProductId(id),
          adjudicacionesService.getByProductId(id)
        ])
        setProduct(productData)
        setQuotationHistory(quotesData || [])
        setAdjudicationHistory(adjData || [])
      } catch (err) {
        console.error('Error loading product data:', err)
        setError('No se pudo cargar la información del producto.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-500 font-medium">{error || 'Producto no encontrado'}</div>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Detalle de Producto
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image & Status */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="aspect-square relative bg-secondary/20 flex items-center justify-center">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Package className="h-16 w-16" />
                  <span className="text-sm">Sin imagen</span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                <div className="flex items-center text-muted-foreground">
                  <Package className="mr-2 h-4 w-4" />
                  <span className="text-sm font-medium">Stock Disponible</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold mr-2">
                    {product.stockQuantity ?? 0}
                  </span>
                  {(product.stockQuantity ?? 0) <= 5 && (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Proveedores</CardTitle>
            </CardHeader>
            <CardContent>
              {product.providers && product.providers.length > 0 ? (
                <ul className="space-y-3">
                  {product.providers.map((provider) => (
                    <li
                      key={provider.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/10 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{provider.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {provider.country}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay proveedores asignados
                </p>
              )}
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Creado: {new Date(product.createdAt).toLocaleDateString()}</p>
            <p>
              Actualizado: {new Date(product.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Right Column: Info & Details */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    {product.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {product.brand && (
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {product.brand} {product.model}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-sm">
                      <Tag className="mr-1 h-3 w-3" />
                      {product.code || "Sin código"}
                    </Badge>
                  </div>
                </div>
                {product.price && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Precio Referencia
                    </p>
                    <p className="text-2xl font-bold flex items-center justify-end">
                      <DollarSign className="h-5 w-5 mr-1" />
                      {product.price}
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Descripción
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {product.description ||
                    "No hay descripción disponible para este producto."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Detalles Adicionales
                  </h3>
                  <p className="text-sm">{product.details || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Observaciones
                  </h3>
                  <p className="text-sm">{product.observations || "-"}</p>
                </div>
              </div>

              {product.equivalentCodes &&
                product.equivalentCodes.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      Códigos Equivalentes
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {product.equivalentCodes.map((code, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="bg-secondary/10"
                        >
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Layers className="mr-2 h-5 w-5 text-primary" />
                Especificaciones Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-secondary/5 border">
                  <div className="flex items-center text-muted-foreground mb-2">
                    <Truck className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Chasis</span>
                  </div>
                  <p className="font-medium">{product.chassis || "-"}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/5 border">
                  <div className="flex items-center text-muted-foreground mb-2">
                    <Layers className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Motor</span>
                  </div>
                  <p className="font-medium">{product.motor || "-"}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/5 border">
                  <div className="flex items-center text-muted-foreground mb-2">
                    <Package className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Equipamiento</span>
                  </div>
                  <p className="font-medium">{product.equipment || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Historial de Cotizaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quotationHistory && quotationHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>ID / Estado</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">
                          Precio Cotizado
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotationHistory.map((item, index) => {
                         const productItem = item.items.find((i) => i.productId === id);
                         // If productItem is not found (shouldn't happen if API is correct), handle gracefully
                         const quantity = productItem?.quantity || 0;
                         const price = productItem?.priceWithoutIVA || 0;
                         const currency = productItem?.currency || 'USD';

                         return (
                        <TableRow key={index}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                              {item.validity && (
                                <span className="text-xs text-muted-foreground">
                                  Vence:{" "}
                                  {
                                    item.validity
                                  }
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-sm font-medium">
                                {item.quotationIdentifier || "-"}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs font-normal"
                              >
                                {item.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {productItem?.providerName || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.associatedPurchase || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {quantity}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {currency} ${typeof price === 'number' ? price.toLocaleString() : price}
                          </TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <DollarSign className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No hay cotizaciones registradas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Historial de Adjudicaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {adjudicationHistory && adjudicationHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Referencias</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">
                          Precio Unit.
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adjudicationHistory.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>
                                {new Date(item.date).toLocaleDateString()}
                              </span>
                              {item.deadlineDate && (
                                <span className="text-xs text-muted-foreground">
                                  Plazo:{" "}
                                  {new Date(
                                    item.deadlineDate,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              {item.internalNumber && (
                                <span className="font-medium">
                                  {item.internalNumber}
                                </span>
                              )}
                              {item.contractId && (
                                <span className="text-xs text-muted-foreground">
                                  {item.contractId}
                                </span>
                              )}
                              {!item.internalNumber && !item.contractId && "-"}
                            </div>
                          </TableCell>
                          <TableCell>{item.entity}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "Pending"
                                  ? "outline"
                                  : "secondary"
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            $
                            {item.unitPrice
                              ? item.unitPrice.toLocaleString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <Tag className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No hay adjudicaciones registradas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
