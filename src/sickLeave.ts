export function calcSickLeave(days: number, dailySalary: number): number {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error('INVALID_DAYS');
  }
  if (!Number.isFinite(dailySalary) || dailySalary < 0) {
    throw new Error('INVALID_SALARY');
  }
  return 0;
}