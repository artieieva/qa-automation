const MAX_SICK_LEAVE_DAYS = 30;

const STAGE1_MAX_DAYS = 5;
const STAGE1_RATE = 0.6;

const STAGE2_MAX_DAYS = 10;
const STAGE2_RATE = 0.8;

export function calcSickLeave(days: number, dailySalary: number): number {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error('INVALID_DAYS');
  }
  if (!Number.isFinite(dailySalary) || dailySalary < 0) {
    throw new Error('INVALID_SALARY');
  }
  if (days > MAX_SICK_LEAVE_DAYS) {
    throw new Error('EXCEEDS_MAX_DAYS');
  }

  if (days <= STAGE1_MAX_DAYS) {
    return days * dailySalary * STAGE1_RATE;
  }

  if (days <= STAGE2_MAX_DAYS) {
    const stage1Pay = STAGE1_MAX_DAYS * dailySalary * STAGE1_RATE;
    const stage2Pay = (days - STAGE1_MAX_DAYS) * dailySalary * STAGE2_RATE;
    return stage1Pay + stage2Pay;
  }

  return 0;
}