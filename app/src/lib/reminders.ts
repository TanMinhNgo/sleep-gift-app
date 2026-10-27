import * as Notifications from 'expo-notifications';

import { getSetting } from './settings';
import { addDays, bedTime, localDate } from './sleep';
import { goodnightOn } from './store';

export type ReminderType = 'caffeine' | 'screen' | 'braindump' | 'bed';
export const REMINDER_TYPES: ReminderType[] = ['caffeine', 'screen', 'braindump', 'bed'];

const MINUTES_BEFORE: Record<ReminderType, number> = { caffeine: 360, screen: 60, braindump: 45, bed: 30 };
const TEXT: Record<ReminderType, { title: string; body: string }> = {
  caffeine: { title: 'Ly cà phê cuối', body: 'Từ giờ tới lúc ngủ, mình uống nước lọc thôi nhé.' },
  screen: { title: 'Giảm sáng màn hình', body: 'Còn 1 tiếng nữa là tới giờ ngủ.' },
  braindump: { title: 'Xả não', body: 'Viết ra việc cần làm ngày mai rồi để nó ở đó.' },
  bed: { title: 'Tới giờ đi ngủ', body: 'Chúc ngủ ngon.' },
};

export function planReminders(p: {
  now: Date;
  bed: string;
  days: number;
  off: ReminderType[];
  goodnight: (date: string) => string | null;
}) {
  const [h, m] = p.bed.split(':').map(Number);
  const out: { type: ReminderType; at: Date; title: string; body: string }[] = [];
  // Bắt đầu từ hôm qua: lúc 00:10 thì "đêm qua" với giờ ngủ 00:30 vẫn còn ở phía trước.
  const first = addDays(localDate(p.now), -1);
  for (let i = 0, nights = 0; nights < p.days && i <= p.days + 1; i++) {
    const night = addDays(first, i);
    // Giờ ngủ trước trưa = rạng sáng hôm sau của đêm đó.
    const [y, mo, d] = (h >= 12 ? night : addDays(night, 1)).split('-').map(Number);
    const bedAt = new Date(y, mo - 1, d, h, m);
    if (bedAt.getTime() - MINUTES_BEFORE.bed * 60000 <= p.now.getTime()) continue; // đêm này đã qua
    nights++;
    for (const type of REMINDER_TYPES) {
      if (p.off.includes(type)) continue;
      const at = new Date(bedAt.getTime() - MINUTES_BEFORE[type] * 60000);
      if (at <= p.now) continue;
      const body = type === 'bed' ? (p.goodnight(night) ?? TEXT.bed.body) : TEXT[type].body;
      out.push({ type, at, title: TEXT[type].title, body });
    }
  }
  return out;
}

let queue: Promise<void> = Promise.resolve();

/** Xếp hàng: hai lần gọi chồng nhau (huỷ–huỷ–lên lịch–lên lịch) sẽ nhân đôi thông báo. */
export function scheduleReminders() {
  queue = queue.then(reschedule, reschedule);
  return queue;
}

async function reschedule() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const wake = getSetting('wake_time');
  const windowMin = Number(getSetting('window_min'));
  if (!wake || !windowMin) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  const off = (getSetting('reminders_off') ?? '').split(',').filter(Boolean) as ReminderType[];
  const plan = planReminders({ now: new Date(), bed: bedTime(wake, windowMin), days: 7, off, goodnight: goodnightOn });
  for (const r of plan) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at },
    });
  }
}
