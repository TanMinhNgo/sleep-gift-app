import { BadRequestException } from '@nestjs/common';

export function vnToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function addDays(value: string, days: number): string {
  if (!isIsoDate(value) || !Number.isInteger(days)) {
    throw new RangeError('invalid date');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function validateDateRange(from: string, to: string): void {
  if (
    typeof from !== 'string' ||
    typeof to !== 'string' ||
    !isIsoDate(from) ||
    !isIsoDate(to) ||
    from > to ||
    (Date.parse(to) - Date.parse(from)) / 86_400_000 >= 366
  ) {
    throw new BadRequestException('invalid date');
  }
}
