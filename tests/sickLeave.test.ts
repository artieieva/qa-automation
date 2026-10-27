import { describe, it, expect } from 'vitest';
import { calcSickLeave } from '../src/sickLeave';

describe('calcSickLeave - TDD', () => {
  // Цикл 1: Валідація некоректних вхідних даних
  it.each([-1, 2.5, NaN])('відхиляє некоректну кількість днів: %s', (days) => {
    expect(() => calcSickLeave(days, 1000)).toThrow('INVALID_DAYS');
  });

  it.each([-100, NaN])('відхиляє некоректну денну зарплату: %s', (salary) => {
    expect(() => calcSickLeave(5, salary)).toThrow('INVALID_SALARY');
  });

  // Цикл 2: Обмеження тривалості (до 30 днів)
  it('відхиляє тривалість лікарняного понад 30 днів (межа 31)', () => {
    expect(() => calcSickLeave(31, 1000)).toThrow('EXCEEDS_MAX_DAYS');
  });
});