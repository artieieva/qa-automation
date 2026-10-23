import { describe, it, expect } from 'vitest';
import {
  calcSubtotal,
  calcDiscountRate,
  calcShipping,
  calcOrderTotal,
  calcVat,
  type OrderItem,
} from '../src/order';

// Допоміжна функція для створення позиції замовлення
const item = (price: number, qty = 1): OrderItem => ({
  sku: 'SKU-1',
  price,
  qty,
});

describe('calcSubtotal', () => {
  it('підсумовує вартість позицій з урахуванням кількості', () => {
    // Arrange
    const items = [item(100, 2), { sku: 'SKU-2', price: 50, qty: 3 }];

    // Act
    const result = calcSubtotal(items);

    // Assert
    expect(result).toBe(350);
  });

  it('відхиляє порожнє замовлення', () => {
    expect(() => calcSubtotal([])).toThrow('EMPTY_ORDER');
  });

  it('відхиляє від’ємну ціну', () => {
    expect(() => calcSubtotal([item(-1)])).toThrow('NEGATIVE_PRICE');
  });

  it.each([0, -1, 1.5])('відхиляє кількість %s', (qty) => {
    expect(() => calcSubtotal([item(100, qty)])).toThrow('INVALID_QTY');
  });
});

describe('calcDiscountRate', () => {
  it.each([
    { tier: 'basic' as const, subtotal: 500, expected: 0 },
    { tier: 'silver' as const, subtotal: 500, expected: 0.05 },
    { tier: 'gold' as const, subtotal: 500, expected: 0.1 },
    { tier: 'basic' as const, subtotal: 2000, expected: 0.05 },
    { tier: 'gold' as const, subtotal: 2000, expected: 0.15 },
  ])(
    'рівень $tier із сумою $subtotal дає ставку $expected',
    ({ tier, subtotal, expected }) => {
      expect(calcDiscountRate(tier, subtotal)).toBeCloseTo(expected, 4);
    },
  );

  it.each([
    { subtotal: 1999, expected: 0 },
    { subtotal: 2000, expected: 0.05 },
    { subtotal: 2001, expected: 0.05 },
  ])('межа великого замовлення: $subtotal', ({ subtotal, expected }) => {
    expect(calcDiscountRate('basic', subtotal)).toBeCloseTo(expected, 4);
  });

  it('обмежує сумарну знижку максимальним значенням', () => {
    expect(calcDiscountRate('gold', 2000, 0.5)).toBe(0.25);
  });

  it('відхиляє від’ємний промокод', () => {
    expect(() => calcDiscountRate('basic', 500, -0.1)).toThrow('INVALID_PROMO');
  });
});

describe('calcShipping', () => {
  it.each([
    [999, 60],
    [1000, 0],
    [1001, 0],
  ])('сума %i → доставка %i', (amount, expected) => {
    expect(calcShipping(amount)).toBe(expected);
  });
});

describe('calcOrderTotal', () => {
  it('додає доставку до замовлення нижче порога', () => {
    const total = calcOrderTotal([item(500)], 'basic');
    expect(total).toBeCloseTo(560, 2);
  });

  it('не додає доставку, якщо сума після знижки сягає порога', () => {
    // 1200 − 10 % = 1080 ≥ 1000, доставка безкоштовна
    const total = calcOrderTotal([item(1200)], 'gold');
    expect(total).toBeCloseTo(1080, 2);
  });

  it('знижка може опустити суму нижче порога доставки', () => {
    // 1050 − 10 % = 945 < 1000, тому доставка платна
    const total = calcOrderTotal([item(1050)], 'gold');
    expect(total).toBeCloseTo(1005, 2);
  });

  it('передає виняток із нижнього рівня', () => {
    expect(() => calcOrderTotal([], 'gold')).toThrow('EMPTY_ORDER');
  });
});

describe('calcVat (Варіант 2)', () => {
  // 1. Параметризований тест типових розрахунків із явними очікуваними числами
  it.each([
    { total: 120, rate: 0.2, expected: 20 },
    { total: 107, rate: 0.07, expected: 7 },
    { total: 99.99, rate: 0.2, expected: 16.67 },
    { total: 0, rate: 0.2, expected: 0 },
  ])(
    'виділяє ПДВ $expected грн із суми $total при ставці $rate',
    ({ total, rate, expected }) => {
      expect(calcVat(total, rate)).toBeCloseTo(expected, 2);
    },
  );

  // 2. Межові значення навколо 0 (нижня межа ставки)
  describe('межові значення ставки навколо 0', () => {
    it('відхиляє ставку, меншу за 0 (межа мінус 0.01)', () => {
      expect(() => calcVat(100, -0.01)).toThrow('INVALID_VAT_RATE');
    });

    it('повертає 0 для нульової ставки ПДВ (точна межа 0)', () => {
      expect(calcVat(100, 0)).toBe(0);
    });

    it('коректно рахує мінімальну додатну ставку (межа плюс 0.01)', () => {
      expect(calcVat(101, 0.01)).toBeCloseTo(1, 2);
    });
  });

  // 3. Межові значення навколо 1 (верхня межа ставки 100%)
  describe('межові значення ставки навколо 1', () => {
    it('коректно рахує ставку перед верхньою межею (межа мінус 0.01)', () => {
      expect(calcVat(199, 0.99)).toBeCloseTo(99, 2);
    });

    it('коректно рахує максимальну ставку 100% (точна межа 1.0)', () => {
      expect(calcVat(200, 1.0)).toBeCloseTo(100, 2);
    });

    it('відхиляє ставку, більшу за 1 (межа плюс 0.01)', () => {
      expect(() => calcVat(100, 1.01)).toThrow('INVALID_VAT_RATE');
    });
  });

  // 4. Перевірка обробки некоректних даних
  describe('обробка некоректних даних', () => {
    it('відхиляє від’ємну суму замовлення', () => {
      expect(() => calcVat(-50, 0.2)).toThrow('INVALID_TOTAL');
    });

    it('відхиляє нечислову суму NaN', () => {
      expect(() => calcVat(NaN, 0.2)).toThrow('INVALID_TOTAL');
    });

    it('відхиляє нечислову ставку NaN', () => {
      expect(() => calcVat(100, NaN)).toThrow('INVALID_VAT_RATE');
    });
  });
});