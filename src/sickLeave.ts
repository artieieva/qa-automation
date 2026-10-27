export function calcSickLeave(days: number, dailySalary: number): number {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error('INVALID_DAYS');
  }
  if (!Number.isFinite(dailySalary) || dailySalary < 0) {
    throw new Error('INVALID_SALARY');
  }
  if (days > 30) {
    throw new Error('EXCEEDS_MAX_DAYS');
  }

  // Мінімальна реалізація для Циклу 3
  if (days <= 5) {
    return days * dailySalary * 0.6;
  }

  return 0;
}