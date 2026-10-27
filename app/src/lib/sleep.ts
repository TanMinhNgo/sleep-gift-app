import { stepTime } from './time';

export type LogInput = {
  date: string; // ngày thức dậy
  bed_time: string;
  wake_time: string;
  latency_min: number;
  awakenings: number;
  awake_min: number;
  rating: number;
};

export const WINDOW_DEFAULT = 480;
export const WINDOW_MIN = 360; // sàn 6 tiếng: không có bác sĩ giám sát
export const WINDOW_MAX = 540;

const pad = (n: number) => String(n).padStart(2, '0');

export const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function at(date: string, hhmm = '00:00') {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi);
}

export const addDays = (date: string, n: number) => {
  const d = at(date);
  d.setDate(d.getDate() + n);
  return localDate(d);
};

/** Giờ lên giường ≥ giờ dậy (theo HH:MM) thì thuộc hôm trước. */
export function bedDateTime(date: string, bed: string, wake: string) {
  const bedDate = bed >= wake ? addDays(date, -1) : date;
  return { bed_time: at(bedDate, bed).toISOString(), wake_time: at(date, wake).toISOString() };
}

export function efficiency(l: LogInput) {
  const inBed = (Date.parse(l.wake_time) - Date.parse(l.bed_time)) / 60000;
  if (inBed <= 0) return 0;
  return Math.max(0, (inBed - l.latency_min - l.awake_min) / inBed);
}

export function nextWindow(s: {
  windowMin: number;
  since: string | null;
  today: string;
  logs: LogInput[];
  restrictionAllowed: boolean;
}) {
  if (!s.since) return { windowMin: WINDOW_DEFAULT, since: s.today };
  const keep = { windowMin: s.windowMin, since: s.since };
  if (addDays(s.since, 7) > s.today) return keep;

  const from = addDays(s.today, -6);
  const recent = s.logs.filter((l) => l.date >= from && l.date <= s.today);
  if (recent.length < 5) return keep;

  // Làm tròn 0,1% để 85%/90% đúng ranh giới, không lệch do sai số dấu phẩy động.
  const pct = Math.round((recent.reduce((a, l) => a + efficiency(l), 0) / recent.length) * 1000) / 10;
  let delta = pct >= 90 ? 15 : pct >= 85 ? 0 : -15;
  if (!s.restrictionAllowed && delta < 0) delta = 0;
  return { windowMin: Math.min(WINDOW_MAX, Math.max(WINDOW_MIN, s.windowMin + delta)), since: s.today };
}

export const bedTime = (wake: string, windowMin: number) => stepTime(wake, -windowMin);
