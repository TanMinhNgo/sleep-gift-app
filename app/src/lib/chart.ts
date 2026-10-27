import { ApiError } from './api';
import { addDays } from './sleep';
import type { Log } from './types';

/** Trục biểu đồ: 20:00 tối → 12:00 trưa hôm sau. */
export const AXIS_LEN = 16 * 60;

export function axisMinutes(iso: string) {
  const d = new Date(iso);
  const t = (d.getHours() * 60 + d.getMinutes() - 20 * 60 + 1440) % 1440;
  if (t <= AXIS_LEN) return t;
  // Ngoài trục (12:00–20:00): trước 16:00 kẹp về 12:00, sau đó coi là lên giường sớm → 20:00.
  return t > AXIS_LEN + 240 ? 0 : AXIS_LEN;
}

export const bar = (l: Log) => ({ start: axisMinutes(l.bed_time) / AXIS_LEN, end: axisMinutes(l.wake_time) / AXIS_LEN });

export function fillDays(from: string, to: string, logs: Log[]) {
  const by = new Map(logs.map((l) => [l.date, l]));
  const out: { date: string; log: Log | null }[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push({ date: d, log: by.get(d) ?? null });
  return out;
}

/** 403 = sleeper tắt chia sẻ, 404 = chưa có sleeper; còn lại (mất mạng…) không đổi màn. */
export function partnerView(e: unknown): 'paused' | 'waiting' | null {
  if (!(e instanceof ApiError)) return null;
  return e.status === 403 ? 'paused' : e.status === 404 ? 'waiting' : null;
}
