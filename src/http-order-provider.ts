import type { OrderProvider, OrderDto } from './reminder-service';

export class HttpOrderProvider implements OrderProvider {
  constructor(private baseUrl: string) {}

  async getOrder(id: string): Promise<OrderDto> {
    const response = await fetch(`${this.baseUrl}/orders/${id}`);

    if (!response.ok) {
      throw new Error(`ORDER_API_ERROR_${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data.id !== 'string' || typeof data.email !== 'string' || typeof data.createdAt !== 'string') {
      throw new Error('INVALID_ORDER_PAYLOAD');
    }

    return data as OrderDto;
  }
}