import { db } from './db';
import type { LogInput } from './sleep';
import type { Log, Note } from './types';

const COLS = 'date, bed_time, wake_time, latency_min, awakenings, awake_min, rating, note, updated_at';

export function saveLog(l: LogInput & { note?: string | null }) {
  db.runSync(
    `insert or replace into logs (${COLS}, dirty) values (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    l.date, l.bed_time, l.wake_time, l.latency_min, l.awakenings, l.awake_min, l.rating, l.note ?? null,
    new Date().toISOString()
  );
}

export const getLog = (date: string) => db.getFirstSync<Log>(`select ${COLS} from logs where date = ?`, date);

export const listLogs = (from: string, to: string) =>
  db.getAllSync<Log>(`select ${COLS} from logs where date between ? and ? order by date`, from, to);

export const dirtyLogs = () => db.getAllSync<Log>(`select ${COLS} from logs where dirty = 1`);

export const hasDirty = () => !!db.getFirstSync('select 1 from logs where dirty = 1');

/** Chỉ xoá cờ khi updated_at còn khớp — người dùng có thể đã sửa tiếp trong lúc đang gửi. */
export function markClean(date: string, updatedAt: string) {
  db.runSync('update logs set dirty = 0 where date = ? and updated_at = ?', date, updatedAt);
}

/** Bản server ghi đè bản cục bộ, trừ ngày đang chờ gửi. */
export function upsertServerLogs(logs: Log[]) {
  db.withTransactionSync(() => {
    for (const l of logs) {
      db.runSync(
        `insert into logs (${COLS}, dirty) values (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
         on conflict(date) do update set bed_time = excluded.bed_time, wake_time = excluded.wake_time,
           latency_min = excluded.latency_min, awakenings = excluded.awakenings, awake_min = excluded.awake_min,
           rating = excluded.rating, note = excluded.note, updated_at = excluded.updated_at
         where logs.dirty = 0`,
        l.date, l.bed_time, l.wake_time, l.latency_min, l.awakenings, l.awake_min, l.rating, l.note, l.updated_at
      );
    }
  });
}

/** Ghi đè goodnight trong [from, to] và toàn bộ scene/word (spec mục 7). */
export function replaceNotes(from: string, to: string, notes: Note[]) {
  db.withTransactionSync(() => {
    db.runSync("delete from notes where kind <> 'goodnight' or show_on_date between ? and ?", from, to);
    for (const n of notes) {
      db.runSync(
        'insert or replace into notes (id, kind, text, show_on_date) values (?, ?, ?, ?)',
        n.id, n.kind, n.text, n.show_on_date
      );
    }
  });
}

export const goodnightOn = (date: string) =>
  db.getFirstSync<{ text: string }>("select text from notes where kind = 'goodnight' and show_on_date = ?", date)?.text ?? null;

/** Khung cảnh / từ gốc partner viết cho trò chơi (đã kéo về lúc sync). */
export const notesOfKind = (kind: 'scene' | 'word') =>
  db.getAllSync<{ id: string; text: string }>('select id, text from notes where kind = ? order by rowid', kind);

export const getBrainDump =(date: string) =>
  db.getFirstSync<{ text: string }>('select text from brain_dump where date = ?', date)?.text ?? '';

export function setBrainDump(date: string, text: string) {
  if (text.trim()) db.runSync('insert or replace into brain_dump (date, text) values (?, ?)', date, text);
  else db.runSync('delete from brain_dump where date = ?', date);
}
