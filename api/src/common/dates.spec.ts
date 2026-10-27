import { addDays, isIsoDate, vnToday } from './dates';

it('uses Vietnam dates across UTC midnight', () => {
  expect(vnToday(new Date('2026-10-24T18:30:00Z'))).toBe('2026-10-25');
  expect(vnToday(new Date('2026-10-25T16:59:00Z'))).toBe('2026-10-25');
  expect(vnToday(new Date('2026-10-25T17:00:00Z'))).toBe('2026-10-26');
  expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
  expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
});

it.each(['2026-02-30', '2026-02-29', 'abc', '', '2026-2-01'])(
  'rejects invalid date %s',
  (value) => {
    expect(isIsoDate(value)).toBe(false);
  },
);

it('accepts real ISO dates and rejects invalid date arithmetic', () => {
  expect(isIsoDate('2026-02-28')).toBe(true);
  expect(isIsoDate('2024-02-29')).toBe(true);
  expect(() => addDays('bad', 1)).toThrow(RangeError);
});
