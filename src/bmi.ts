export function calculateBMI(weightKg: number, heightMeters: number): number {
  if (!Number.isFinite(heightMeters) || heightMeters <= 0) {
    throw new Error('INVALID_HEIGHT');
  }

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('INVALID_WEIGHT');
  }

  const bmi = weightKg / (heightMeters * heightMeters);
  return Math.round(bmi * 100) / 100;
}