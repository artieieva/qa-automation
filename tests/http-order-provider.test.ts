 import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './msw/server';
import { HttpOrderProvider } from '../src/http-order-provider';

const BASE_URL = 'https://api.example.com';
const provider = new HttpOrderProvider(BASE_URL);

describe('HttpOrderProvider — тестування через MSW', () => {
  const ORDER_URL = `${BASE_URL}/orders/:id`;

  // Сценарій 1: Успіх
  it('повертає замовлення при успішній відповіді 200', async () => {
    server.use(
      http.get(ORDER_URL, ({ params }) => {
        return HttpResponse.json({
          id: params.id,
          email: 'customer@example.com',
          createdAt: '2026-03-01T10:00:00.000Z',
        });
      }),
    );

    const order = await provider.getOrder('ord-123');
    expect(order.id).toBe('ord-123');
    expect(order.email).toBe('customer@example.com');
  });

  // Сценарій 2: Помилковий статус (404)
  it('викидає помилку при статусі 404', async () => {
    server.use(
      http.get(ORDER_URL, () => new HttpResponse(null, { status: 404 })),
    );

    await expect(provider.getOrder('ord-none')).rejects.toThrow('ORDER_API_ERROR_404');
  });

  // Сценарій 3: Некоректний формат (відсутнє обов’язкове поле createdAt)
  it('викидає помилку, якщо формат тіла відповіді пошкоджений', async () => {
    server.use(
      http.get(ORDER_URL, () => {
        return HttpResponse.json({
          id: 'ord-broken',
          email: 'customer@example.com',
          // createdAt пропущено
        });
      }),
    );

    await expect(provider.getOrder('ord-broken')).rejects.toThrow('INVALID_ORDER_PAYLOAD');
  });
});