import api from "@/lib/axios";

export enum DeliveryItemStatus {
  PENDING = 'pendiente_entrega',
  ON_WAY = 'en_camino',
  DELIVERED = 'entregado',
  ISSUE = 'problema_entrega',
}

export enum DeliveryStatus {
  PENDING = 'pendiente',
  PARTIAL = 'parcial',
  COMPLETED = 'completado',
  ISSUE = 'con_problemas',
}

export interface DeliveryItem {
  id: number;
  deliveryId: number;
  productId?: number;
  productCode: string;
  productName: string;
  quantity: number;
  status: DeliveryItemStatus;
  estimatedDate: string;
  actualDate?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: number;
  deliveryId: number;
  invoiceNumber: string;
  fileName?: string;
  fileUrl?: string;
  issueDate: string;
  createdAt: string;
}

export interface Delivery {
  id: number;
  licitationId: number;
  items: DeliveryItem[];
  invoices: Invoice[];
  observations?: string;
  calculatedStatus: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDeliveryItemDto {
  status?: DeliveryItemStatus;
  actualDate?: string;
  observations?: string;
  quantity?: number;
}

export interface CreateInvoiceDto {
  invoiceNumber: string;
  fileName?: string;
  fileUrl?: string;
  issueDate: string;
}

class EntregasService {
  private http = api;

  async getByLicitation(licitationId: number): Promise<Delivery | null> {
    try {
      const response = await this.http.get<{ success: boolean; data: Delivery | null }>(`/deliveries/licitation/${licitationId}`);
      console.log('[EntregasService] Full response.data:', response.data);
      console.log('[EntregasService] Extracted data:', response.data?.data);
      return response.data?.data ?? null;
    } catch (error) {
      console.error('[EntregasService] Error:', error);
      return null;
    }
  }

  async getById(id: number): Promise<Delivery> {
    const response = await this.http.get<Delivery>(`/deliveries/${id}`);
    return response.data;
  }

  async updateItemStatus(
    deliveryId: number,
    itemId: number,
    data: UpdateDeliveryItemDto
  ): Promise<DeliveryItem> {
    const response = await this.http.patch<DeliveryItem>(
      `/deliveries/${deliveryId}/items/${itemId}`,
      data
    );
    return response.data;
  }

  async addInvoice(deliveryId: number, data: CreateInvoiceDto): Promise<Invoice> {
    const response = await this.http.post<Invoice>(
      `/deliveries/${deliveryId}/invoices`,
      data
    );
    return response.data;
  }

  async getInvoices(deliveryId: number): Promise<Invoice[]> {
    const response = await this.http.get<Invoice[]>(`/deliveries/${deliveryId}/invoices`);
    return response.data;
  }
}

export const entregasService = new EntregasService();
