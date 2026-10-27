import { api, ApiError } from './api';
import { scheduleReminders } from './reminders';
import { getSetting, setSetting } from './settings';
import { addDays, localDate, nextWindow, WINDOW_DEFAULT } from './sleep';
import { dirtyLogs, listLogs, markClean, replaceNotes, upsertServerLogs } from './store';
import type { Log, Note } from './types';

const isOffline = (e: unknown) => e instanceof ApiError && e.status === 0;

async function network(today: string) {
  for (const { date, note, ...rest } of dirtyLogs()) {
    try {
      // applied:false = server đã có bản mới hơn/bằng → cũng coi là xong, không gửi lại mãi.
      await api('PUT', `/logs/${date}`, note == null ? rest : { ...rest, note });
      markClean(date, rest.updated_at);
    } catch (e) {
      if (isOffline(e)) throw e;
      // Lỗi khác (vd 400): để dirty, không chặn các ngày còn lại.
    }
  }
  upsertServerLogs(await api<Log[]>('GET', `/logs?from=${addDays(today, -29)}&to=${today}`));
  const to = addDays(today, 7);
  replaceNotes(today, to, await api<Note[]>('GET', `/notes?from=${today}&to=${to}`));
}

/** Gọi khi app mở / quay lại foreground. Mất mạng vẫn chỉnh cửa sổ và lên lịch nhắc từ dữ liệu cục bộ. */
export async function syncSleeper(now = new Date()) {
  const today = localDate(now);
  let offline = false;
  try {
    await network(today);
  } catch (e) {
    offline = isOffline(e);
  }

  const next = nextWindow({
    windowMin: Number(getSetting('window_min')) || WINDOW_DEFAULT,
    since: getSetting('window_since'),
    today,
    logs: listLogs(addDays(today, -6), today),
    restrictionAllowed: getSetting('restriction_allowed') !== '0',
  });
  setSetting('window_min', String(next.windowMin));
  setSetting('window_since', next.since);

  await scheduleReminders().catch(() => {});
  return { offline };
}
