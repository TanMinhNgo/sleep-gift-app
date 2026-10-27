const pad = (n: number) => String(n).padStart(2, '0');

/** 'HH:MM' cộng/trừ `delta` phút, vòng qua nửa đêm. */
export function stepTime(hhmm: string, delta: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const t = (((h * 60 + m + delta) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}
