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

  if (days <= 5) {
    return days * dailySalary * 0.6;
  }

  if (days <= 10) {
    const stage1Pay = 5 * dailySalary * 0.6;
    const stage2Pay = (days - 5) * dailySalary * 0.8;
    return stage1Pay + stage2Pay;
  }

  return 0;
}