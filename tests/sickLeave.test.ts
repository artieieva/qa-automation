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

  // Цикл 3: Розбіг від 0 до 5 днів (ставка 60%)
  it.each([
    { days: 0, expected: 0 },
    { days: 1, expected: 600 },
    { days: 5, expected: 3000 },
  ])('розраховує 60% за перші 5 днів: $days дн. -> $expected грн', ({ days, expected }) => {
    expect(calcSickLeave(days, 1000)).toBe(expected);
  });
  it.each([
    { days: 6, expected: 3800 },
    { days: 10, expected: 7000 },
  ])('розраховує 80% за дні з 6 по 10: $days дн. -> $expected грн', ({ days, expected }) => {
    expect(calcSickLeave(days, 1000)).toBe(expected);
  });
  it.each([
    { days: 11, expected: 8000 },
    { days: 30, expected: 27000 },
  ])('розраховує 100% за дні з 11 по 30: $days дн. -> $expected грн', ({ days, expected }) => {
    expect(calcSickLeave(days, 1000)).toBe(expected);
  });
});