import { describe, it, expect } from 'vitest';
import { calcSickLeave } from '../src/sickLeave';

describe('calcSickLeave - TDD', () => {
  it.each([-1, 2.5, NaN])('відхиляє некоректну кількість днів: %s', (days) => {
    expect(() => calcSickLeave(days, 1000)).toThrow('INVALID_DAYS');
  });

  it.each([-100, NaN])('відхиляє некоректну денну зарплату: %s', (salary) => {
    expect(() => calcSickLeave(5, salary)).toThrow('INVALID_SALARY');
  });
});