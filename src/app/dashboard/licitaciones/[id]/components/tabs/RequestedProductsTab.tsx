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
                <TableRow key={lp.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{lp.product.name}</TableCell>
                  <TableCell>
                    {lp.product.brand} {lp.product.model}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-semibold bg-muted/50 text-muted-foreground border-border">
                      {lp.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={lp.product.stockQuantity && lp.product.stockQuantity > 0 
                      ? "bg-green-500/10 text-green-500 border-green-500/20 font-semibold" 
                      : "bg-red-500/10 text-red-500 border-red-500/20 font-semibold"
                    }>
                      {lp.product.stockQuantity || 0}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay productos registrados en esta licitación
          </div>
        )}
      </CardContent>
    </Card>
  );
};
