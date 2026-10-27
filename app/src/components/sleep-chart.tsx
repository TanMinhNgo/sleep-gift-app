import { View } from 'react-native';

import { bar, fillDays } from '@/lib/chart';

import { C, MoonPhase, T } from './night';

const H = 200;
const TICKS = [
  ['20h', 0],
  ['0h', 0.25],
  ['4h', 0.5],
  ['8h', 0.75],
  ['12h', 1],
] as const;
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Mỗi cột một ngày: thanh từ giờ lên giường tới giờ dậy, dưới là cảm nhận. Không có điểm số. */
export function SleepChart({ days }: { days: ReturnType<typeof fillDays> }) {
  const wide = days.length <= 7;
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ height: H, justifyContent: 'space-between' }} accessible={false}>
        {TICKS.map(([t]) => (
          <T key={t} muted style={{ fontSize: 11, lineHeight: 12 }}>
            {t}
          </T>
        ))}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ height: H, flexDirection: 'row', gap: wide ? 10 : 2 }}>
          {TICKS.map(([t, f]) => (
            <View key={t} style={{ position: 'absolute', left: 0, right: 0, top: f * H, height: 1, backgroundColor: 'rgba(185,196,255,0.08)' }} />
          ))}
          {days.map(({ date, log }) => {
            const b = log && bar(log);
            return (
              <View
                key={date}
                accessible
                accessibilityLabel={
                  log
                    ? `Ngày ${date.slice(8)}/${date.slice(5, 7)}: ngủ ${hhmm(log.bed_time)}, dậy ${hhmm(log.wake_time)}, cảm nhận ${log.rating} trên 5`
                    : `Ngày ${date.slice(8)}/${date.slice(5, 7)}: chưa ghi`
                }
                style={{ flex: 1 }}>
                {b && (
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: b.start * H,
                      height: Math.max(4, (b.end - b.start) * H),
                      borderRadius: wide ? 10 : 3,
                      backgroundImage: 'linear-gradient(180deg, #B3BEFF, #6E7FF0)',
                      boxShadow: wide ? 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 10px rgba(96,112,240,0.35)' : undefined,
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: wide ? 10 : 2, marginTop: 10 }}>
          {days.map(({ date, log }, i) => {
            const [y, m, d] = date.split('-').map(Number);
            return (
              <View key={date} style={{ flex: 1, alignItems: 'center', gap: 6 }} accessible={false}>
                {wide ? (
                  <MoonPhase n={log?.rating ?? 0} size={22} />
                ) : (
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold, opacity: log ? 0.2 + log.rating * 0.16 : 0.08 }} />
                )}
                <T muted style={{ fontSize: 10 }}>
                  {wide ? WEEKDAY[new Date(y, m - 1, d).getDay()] : i % 7 === 0 ? `${d}/${m}` : ' '}
                </T>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
