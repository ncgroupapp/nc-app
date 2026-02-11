import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package } from "lucide-react";
import { LicitationProduct } from "@/services/licitaciones.service";

interface RequestedProductsTabProps {
  licitationProducts: LicitationProduct[] | undefined;
}

export const RequestedProductsTab = ({ licitationProducts }: RequestedProductsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Productos Solicitados</span>
          </span>
          <Badge variant="outline">
            {licitationProducts?.length || 0} productos
          </Badge>
        </CardTitle>
        <CardDescription>
          Productos incluidos en esta licitación
        </CardDescription>
      </CardHeader>
      <CardContent>
        {licitationProducts && licitationProducts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead className="text-center">Cantidad Solicitada</TableHead>
                <TableHead>Stock Disponible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licitationProducts.map((lp) => (
                <TableRow key={lp.id}>
                  <TableCell className="font-medium">{lp.product.name}</TableCell>
                  <TableCell>
                    {lp.product.brand} {lp.product.model}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-bold">
                      {lp.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lp.product.stockQuantity && lp.product.stockQuantity > 0 ? "default" : "destructive"}>
                      {lp.product.stockQuantity || 0}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay productos registrados en esta licitación
          </div>
        )}
      </CardContent>
    </Card>
  );
};
