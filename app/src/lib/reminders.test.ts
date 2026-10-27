import { planReminders, scheduleReminders } from './reminders';
import { localDate } from './sleep';

jest.mock('./store', () => ({ goodnightOn: () => null }));
jest.mock('./settings', () => ({
  getSetting: (k: string) => ({ wake_time: '06:30', window_min: '480' })[k] ?? null,
}));
const mockCalls: string[] = [];
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: async () => ({ granted: true }),
  cancelAllScheduledNotificationsAsync: async () => {
    mockCalls.push('cancel');
  },
  scheduleNotificationAsync: async () => {
    await new Promise((r) => setTimeout(r, 0)); // nhường lượt như native thật
    mockCalls.push('schedule');
    return 'id';
  },
}));

it('concurrent calls do not duplicate notifications', async () => {
  await Promise.all([scheduleReminders(), scheduleReminders()]);
  // Mỗi lần huỷ phải đi trước đúng một loạt lên lịch, không xen nhau.
  const runs = mockCalls.join(',').split('cancel,').filter(Boolean);
  expect(runs).toHaveLength(2);
  expect(runs.every((r) => r.split(',').filter(Boolean).length === 28)).toBe(true);
});

const p = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${localDate(d)} ${p(d.getHours())}:${p(d.getMinutes())}`;
const none = () => null;

it('four reminders per night at the right offsets', () => {
  const r = planReminders({ now: new Date(2026, 9, 27, 8, 0), bed: '22:30', days: 1, off: [], goodnight: none });
  expect(r.map((x) => [x.type, fmt(x.at)])).toEqual([
    ['caffeine', '2026-10-27 16:30'],
    ['screen', '2026-10-27 21:30'],
    ['braindump', '2026-10-27 21:45'],
    ['bed', '2026-10-27 22:00'],
  ]);
});

it('crosses midnight', () => {
  const r = planReminders({ now: new Date(2026, 9, 27, 8, 0), bed: '00:30', days: 1, off: [], goodnight: none });
  expect(fmt(r[0].at)).toBe('2026-10-27 18:30');
  expect(fmt(r[3].at)).toBe('2026-10-28 00:00');
});

it('skips times already past', () => {
  const r = planReminders({ now: new Date(2026, 9, 27, 21, 40), bed: '22:30', days: 2, off: [], goodnight: none });
  expect(r.map((x) => fmt(x.at)).slice(0, 3)).toEqual(['2026-10-27 21:45', '2026-10-27 22:00', '2026-10-28 16:30']);
  expect(r).toHaveLength(6);
});

it('skips disabled types', () => {
  const r = planReminders({ now: new Date(2026, 9, 27, 8, 0), bed: '22:30', days: 1, off: ['caffeine'], goodnight: none });
  expect(r.map((x) => x.type)).toEqual(['screen', 'braindump', 'bed']);
});

it('embeds goodnight text of that night', () => {
  const r = planReminders({
    now: new Date(2026, 9, 27, 8, 0),
    bed: '22:30',
    days: 2,
    off: [],
    goodnight: (d) => (d === '2026-10-27' ? 'Mơ đẹp nha' : null),
  });
  const beds = r.filter((x) => x.type === 'bed');
  expect(beds.map((x) => x.body)).toEqual(['Mơ đẹp nha', 'Chúc ngủ ngon.']);
  expect(beds[0].title).toBe('Tới giờ đi ngủ');
});

it('7 days → 28 reminders', () => {
  expect(planReminders({ now: new Date(2026, 9, 27, 8, 0), bed: '22:30', days: 7, off: [], goodnight: none })).toHaveLength(28);
});
