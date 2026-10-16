import { describe, it, expect } from 'vitest';
import { calculateBMI } from '../src/bmi';

describe('calculateBMI', () => {
  it('повертає нормальний індекс маси тіла для дорослої людини середньої статури', () => {
    const result = calculateBMI(70, 1.75);
    expect(result).toBe(22.86);
  });

  it('повертає точне значення при параметрах, що дають ціле число', () => {
    const result = calculateBMI(80, 2.0);
    expect(result).toBe(20);
  });

  it('викидає виняток INVALID_HEIGHT, коли зріст дорівнює нулю', () => {
    expect(() => calculateBMI(65, 0)).toThrow('INVALID_HEIGHT');
  });

  it('викидає виняток INVALID_HEIGHT при від’ємному значенні зросту', () => {
    expect(() => calculateBMI(75, -1.8)).toThrow('INVALID_HEIGHT');
  });

  it('викидає виняток INVALID_HEIGHT, якщо передано нечислове значення NaN', () => {
    expect(() => calculateBMI(70, NaN)).toThrow('INVALID_HEIGHT');
  });

  it('викидає виняток INVALID_WEIGHT при нульовій або від’ємній вазі', () => {
    expect(() => calculateBMI(0, 1.75)).toThrow('INVALID_WEIGHT');
    expect(() => calculateBMI(-50, 1.75)).toThrow('INVALID_WEIGHT');
  });
});