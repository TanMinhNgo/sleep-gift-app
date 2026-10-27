import { addDays, bedDateTime, bedTime, efficiency, localDate, nextWindow, type LogInput } from './sleep';

const local = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${localDate(d)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** Log ngày `date`, 8 tiếng trên giường, hiệu suất `hs`. */
function log(date: string, hs: number): LogInput {
  const { bed_time, wake_time } = bedDateTime(date, '22:30', '06:30');
  return { date, bed_time, wake_time, latency_min: Math.round(480 * (1 - hs)), awakenings: 0, awake_min: 0, rating: 3 };
}
const today = '2026-10-27';
const lastDays = (n: number, hs: number) => Array.from({ length: n }, (_, i) => log(addDays(today, -i), hs));

it('bed before midnight belongs to previous day', () => {
  const r = bedDateTime('2026-10-27', '23:15', '06:30');
  expect(local(r.bed_time)).toBe('2026-10-26 23:15');
  expect(local(r.wake_time)).toBe('2026-10-27 06:30');
});

it('bed after midnight', () => {
  expect(local(bedDateTime('2026-10-27', '00:30', '06:30').bed_time)).toBe('2026-10-27 00:30');
});

it('addDays crosses months', () => {
  expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
});

it('efficiency', () => {
  const { bed_time, wake_time } = bedDateTime(today, '22:30', '06:30');
  expect(efficiency({ date: today, bed_time, wake_time, latency_min: 30, awakenings: 1, awake_min: 30, rating: 3 })).toBeCloseTo(0.875);
});

const base = { windowMin: 480, since: addDays(today, -8), today, restrictionAllowed: true };

it('needs 5 logs', () => {
  expect(nextWindow({ ...base, logs: lastDays(4, 0.95) })).toEqual({ windowMin: 480, since: base.since });
});

it('waits 7 days', () => {
  const since = addDays(today, -3);
  expect(nextWindow({ ...base, since, logs: lastDays(7, 0.95) })).toEqual({ windowMin: 480, since });
});

it('extend / keep / restrict', () => {
  expect(nextWindow({ ...base, logs: lastDays(7, 0.9) })).toEqual({ windowMin: 495, since: today });
  expect(nextWindow({ ...base, logs: lastDays(7, 0.85) })).toEqual({ windowMin: 480, since: today });
  expect(nextWindow({ ...base, logs: lastDays(7, 0.8) }).windowMin).toBe(465);
});

it('floor and ceiling', () => {
  expect(nextWindow({ ...base, windowMin: 360, logs: lastDays(7, 0.5) }).windowMin).toBe(360);
  expect(nextWindow({ ...base, windowMin: 540, logs: lastDays(7, 0.99) }).windowMin).toBe(540);
});

it('restriction disallowed never shrinks', () => {
  expect(nextWindow({ ...base, restrictionAllowed: false, logs: lastDays(7, 0.5) }).windowMin).toBe(480);
});

it('only last 7 days count', () => {
  const logs = [...lastDays(4, 0.95), log(addDays(today, -7), 0.95), log(addDays(today, -8), 0.95)];
  expect(nextWindow({ ...base, logs }).windowMin).toBe(480);
});

it('first run starts at default', () => {
  expect(nextWindow({ ...base, since: null, logs: [] })).toEqual({ windowMin: 480, since: today });
});

it('bedTime wraps midnight', () => {
  expect(bedTime('06:30', 480)).toBe('22:30');
  expect(bedTime('01:00', 540)).toBe('16:00');
});
