import { db } from './db';

export type SettingKey =
  | 'role'
  | 'consent_done'
  | 'screening_done'
  | 'restriction_allowed'
  | 'wake_time'
  | 'window_min'
  | 'window_since'
  | 'reminders_off'; // CSV các ReminderType

export function getSetting(key: SettingKey): string | null {
  return db.getFirstSync<{ value: string }>('select value from settings where key = ?', key)?.value ?? null;
}

export function setSetting(key: SettingKey, value: string) {
  db.runSync('insert or replace into settings (key, value) values (?, ?)', key, value);
}
