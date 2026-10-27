import { stepTime } from './time';

it('steps by minutes and pads', () => {
  expect(stepTime('06:30', 15)).toBe('06:45');
  expect(stepTime('06:30', -15)).toBe('06:15');
  expect(stepTime('09:50', 15)).toBe('10:05');
});

it('wraps around midnight', () => {
  expect(stepTime('23:45', 15)).toBe('00:00');
  expect(stepTime('00:00', -15)).toBe('23:45');
});
