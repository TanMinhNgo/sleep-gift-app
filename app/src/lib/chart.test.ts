import { axisMinutes, bar, fillDays, partnerView } from './chart';
import { ApiError } from './api';
import type { Log } from './types';

jest.mock('./session', () => ({ getToken: async () => null }));

const at = (date: string, hhmm: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi).toISOString();
};
const log = (date: string, bed: string, bedDate: string, wake: string): Log => ({
  date,
  bed_time: at(bedDate, bed),
  wake_time: at(date, wake),
  latency_min: 10,
  awakenings: 0,
  awake_min: 0,
  rating: 4,
  note: null,
  updated_at: '',
});

it('axis positions', () => {
  expect(axisMinutes(at('2026-10-26', '20:00'))).toBe(0);
  expect(axisMinutes(at('2026-10-26', '23:00'))).toBe(180);
  expect(axisMinutes(at('2026-10-27', '06:30'))).toBe(630);
  expect(axisMinutes(at('2026-10-27', '12:00'))).toBe(960);
});

it('clamps', () => {
  expect(axisMinutes(at('2026-10-26', '19:30'))).toBe(0);
  expect(axisMinutes(at('2026-10-27', '13:00'))).toBe(960);
});

it('bar fractions', () => {
  const b = bar(log('2026-10-27', '22:00', '2026-10-26', '06:00'));
  expect(b.start).toBeCloseTo(120 / 960);
  expect(b.end).toBeCloseTo(600 / 960);
});

it('days fills gaps', () => {
  const d = fillDays('2026-10-25', '2026-10-27', [log('2026-10-26', '23:00', '2026-10-25', '07:00')]);
  expect(d.map((x) => [x.date, !!x.log])).toEqual([
    ['2026-10-25', false],
    ['2026-10-26', true],
    ['2026-10-27', false],
  ]);
});

it('partnerView', () => {
  expect(partnerView(new ApiError(403, 'sharing disabled'))).toBe('paused');
  expect(partnerView(new ApiError(404, 'no sleeper yet'))).toBe('waiting');
  expect(partnerView(new ApiError(0, 'network'))).toBeNull();
});
