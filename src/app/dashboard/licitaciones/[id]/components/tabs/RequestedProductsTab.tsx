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
import { Package, Hash, Tag } from "lucide-react";
import { LicitationProduct } from "@/services/licitaciones.service";

interface RequestedProductsTabProps {
  licitationProducts: LicitationProduct[] | undefined;
}

export const RequestedProductsTab = ({ licitationProducts }: RequestedProductsTabProps) => {
  return (
    <Card className="border shadow-sm bg-card overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-xl flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-primary" />
            <span>Productos Solicitados</span>
          </span>
          <Badge variant="secondary" className="font-bold">
            {licitationProducts?.length || 0} items
          </Badge>
        </CardTitle>
        <CardDescription>
          Detalle de los productos requeridos en este proceso
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="rounded-md border overflow-hidden bg-background">
          {licitationProducts && licitationProducts.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">Producto</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licitationProducts.map((lp) => (
                  <TableRow key={lp.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground opacity-70" aria-hidden="true" />
                        <span className="font-medium">{lp.product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">
                          {lp.product.brand} {lp.product.model}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 font-mono text-xs font-bold">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        {lp.quantity}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`${
                        lp.product.stockQuantity && lp.product.stockQuantity > 0 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-red-50 text-red-700 border-red-200"
                        } font-bold text-[10px] h-5 px-1.5`}
                      >
                        {lp.product.stockQuantity || 0}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
              <p>No hay productos registrados en esta licitación.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
