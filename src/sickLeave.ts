const MAX_SICK_LEAVE_DAYS = 30;

const STAGE1_MAX_DAYS = 5;
const STAGE1_RATE = 0.6;

const STAGE2_MAX_DAYS = 10;
const STAGE2_RATE = 0.8;

const STAGE3_RATE = 1.0;

const round2 = (n: number): number => Math.round(n * 100) / 100;

function validateInputs(days: number, dailySalary: number): void {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error('INVALID_DAYS');
  }
  if (!Number.isFinite(dailySalary) || dailySalary < 0) {
    throw new Error('INVALID_SALARY');
  }
  if (days > MAX_SICK_LEAVE_DAYS) {
    throw new Error('EXCEEDS_MAX_DAYS');
  }
}

export function calcSickLeave(days: number, dailySalary: number): number {
  validateInputs(days, dailySalary);

  if (days === 0) return 0;

  const stage1Days = Math.min(days, STAGE1_MAX_DAYS);
  const stage2Days = Math.min(Math.max(0, days - STAGE1_MAX_DAYS), STAGE2_MAX_DAYS - STAGE1_MAX_DAYS);
  const stage3Days = Math.max(0, days - STAGE2_MAX_DAYS);

  const totalPay =
    stage1Days * dailySalary * STAGE1_RATE +
    stage2Days * dailySalary * STAGE2_RATE +
    stage3Days * dailySalary * STAGE3_RATE;

  return round2(totalPay);
}