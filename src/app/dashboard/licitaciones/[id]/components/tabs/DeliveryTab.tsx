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
import { Truck } from "lucide-react";
import { Adjudication } from "@/services/adjudicaciones.service";
import { LicitationStatus } from "@/services/licitaciones.service";
import { AdjudicationStatus } from "@/types";

interface DeliveryTabProps {
  adjudications: Adjudication[];
  licitationStatus: LicitationStatus;
}

export const DeliveryTab = ({ adjudications, licitationStatus }: DeliveryTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>Entrega de Productos</span>
        </CardTitle>
        <CardDescription>
          Estado de entrega de los productos adjudicados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {adjudications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay productos adjudicados para mostrar.
            {licitationStatus === LicitationStatus.PENDING && (
              <p className="mt-2 text-sm">
                Primero debe finalizar la cotización y registrar la adjudicación.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {adjudications.map((adjudication) => (
              <div key={adjudication.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Adjudicación #{adjudication.id}</h4>
                  <Badge>
                    {adjudication.status === AdjudicationStatus.TOTAL ? 'Total' : 'Parcial'}
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unit.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjudication.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${Number(item.unitPrice).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Total: ${Number(adjudication.totalPriceWithIVA).toFixed(2)} (con IVA)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
