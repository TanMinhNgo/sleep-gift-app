import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, View } from 'react-native';

import { Moon3D } from '@/components/moon-3d';
import { Button3D, C, Card, MoonPhase, RoundButton, Screen, T } from '@/components/night';
import { SleepChart } from '@/components/sleep-chart';
import { api } from '@/lib/api';
import { fillDays, partnerView } from '@/lib/chart';
import { scheduleReminders } from '@/lib/reminders';
import { getSetting } from '@/lib/settings';
import { addDays, bedTime, localDate, WINDOW_DEFAULT } from '@/lib/sleep';
import { hasDirty, listLogs } from '@/lib/store';
import { syncSleeper } from '@/lib/sync';
import type { Log, Me } from '@/lib/types';

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <View>
        <T muted>{subtitle}</T>
        <T accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800', marginTop: 4 }}>
          {title}
        </T>
      </View>
      <RoundButton label="Cài đặt" icon="⚙" onPress={() => router.push('/settings')} />
    </View>
  );
}

function SleeperHome() {
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const now = new Date();
  const today = localDate(now);

  const sync = useCallback(() => {
    syncSleeper().then(refresh);
  }, []);
  useFocusEffect(sync);
  useEffect(() => {
    // Xin quyền một lần; từ chối thì app vẫn dùng được, Cài đặt sẽ hướng dẫn bật lại.
    Notifications.requestPermissionsAsync().then(() => scheduleReminders());
    const sub = AppState.addEventListener('change', (s) => s === 'active' && sync());
    return () => sub.remove();
  }, [sync]);

  const wake = getSetting('wake_time') ?? '06:30';
  const bed = bedTime(wake, Number(getSetting('window_min')) || WINDOW_DEFAULT);
  const logs = listLogs(addDays(today, -6), today);
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const loggedToday = byDate.has(today);
  const morning = now.getHours() < 12;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 18, flexGrow: 1 }}>
        <Header
          subtitle={`${WEEKDAY_LONG[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1}`}
          title={morning ? 'Chào buổi sáng' : 'Chào buổi tối'}
        />
        <Moon3D style={{ height: 220 }} />
        {hasDirty() && (
          <T muted accessibilityLiveRegion="polite" style={{ fontSize: 13, textAlign: 'center', marginTop: -8 }}>
            ● Chưa đồng bộ
          </T>
        )}

        <Card style={{ gap: 6, transform: [{ perspective: 900 }, { rotateX: '5deg' }] }}>
          <T style={{ fontSize: 20, fontWeight: '700' }}>{loggedToday ? 'Đã ghi nhật ký sáng nay' : 'Đêm qua bạn ngủ thế nào?'}</T>
          <T muted style={{ fontSize: 14, marginBottom: 12 }}>
            {loggedToday ? 'Có thể sửa lại nếu nhớ ra điều gì.' : 'Ghi nhanh, chưa tới 30 giây.'}
          </T>
          <Button3D label={loggedToday ? 'Sửa nhật ký sáng nay' : 'Ghi nhật ký sáng'} onPress={() => router.push('/diary')} />
        </Card>

        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Card style={{ flex: 1, padding: 18 }}>
            <T muted style={{ fontSize: 13, fontWeight: '600' }}>
              Tối nay lên giường
            </T>
            <T style={{ fontSize: 28, fontWeight: '800', color: C.gold, marginTop: 4 }}>{bed}</T>
          </Card>
          <Card style={{ flex: 1, padding: 18 }}>
            <T muted style={{ fontSize: 13, fontWeight: '600' }}>
              Giờ dậy
            </T>
            <T style={{ fontSize: 28, fontWeight: '800', color: C.gold, marginTop: 4 }}>{wake}</T>
          </Card>
        </View>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Button3D label="Xả não" variant="secondary" onPress={() => router.push('/brain-dump')} style={{ flex: 1 }} />
          <Button3D label="Trò chơi ru ngủ" variant="secondary" onPress={() => router.push('/games')} style={{ flex: 1 }} />
        </View>

        <Card style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T style={{ fontWeight: '700' }}>7 ngày qua</T>
            <T muted style={{ fontSize: 13 }}>
              Giờ dậy · cảm nhận
            </T>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDays(today, i - 6);
              const l = byDate.get(date);
              const [y, m, d] = date.split('-').map(Number);
              const wd = WEEKDAY[new Date(y, m - 1, d).getDay()];
              return (
                <View
                  key={date}
                  accessible
                  accessibilityLabel={l ? `${wd}: dậy ${hhmm(l.wake_time)}, cảm nhận ${l.rating} trên 5` : `${wd}: chưa ghi`}
                  style={{ alignItems: 'center', gap: 6 }}>
                  <T muted style={{ fontSize: 12, fontWeight: '600' }}>
                    {wd}
                  </T>
                  <MoonPhase n={l?.rating ?? 0} />
                  <T style={{ fontSize: 12, fontWeight: '600' }}>{l ? hhmm(l.wake_time) : '—'}</T>
                </View>
              );
            })}
          </View>
          {logs.length < 5 && (
            <T muted style={{ fontSize: 13, marginTop: 14, lineHeight: 20 }}>
              Ghi đủ 5 trong 7 ngày để app tự chỉnh giờ lên giường cho bạn.
            </T>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function PartnerHome() {
  const [me, setMe] = useState<Me | null>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [logs, setLogs] = useState<Log[]>([]);
  const [view, setView] = useState<'ok' | 'paused' | 'waiting' | 'offline'>('ok');
  const today = localDate(new Date());
  const from = addDays(today, 1 - range);

  useFocusEffect(
    useCallback(() => {
      api<Me>('GET', '/me')
        .then(setMe)
        .catch(() => {}); // mất mạng: vẫn hiện màn, không báo lỗi to (spec mục 8)
      api<Log[]>('GET', `/logs?from=${from}&to=${today}`)
        .then((l) => {
          setLogs(l);
          setView('ok');
        })
        .catch((e) => {
          const v = partnerView(e);
          // Tắt chia sẻ / chưa ghép đôi: xoá dữ liệu đang hiện, không giữ bản cũ.
          if (v) setLogs([]);
          setView(v ?? 'offline');
        });
    }, [from, today])
  );

  const other = me?.other?.name ?? 'Người ấy';
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 18 }}>
        <Header subtitle="Xin chào," title={me?.name ?? ' '} />
        <Moon3D style={{ height: 180 }} />

        {view === 'paused' || view === 'waiting' ? (
          <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
            <MoonPhase n={view === 'paused' ? 2 : 0} size={40} />
            <T style={{ fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 8 }}>
              {view === 'paused' ? `${other} đang tạm ngừng chia sẻ` : 'Đang chờ người ấy tham gia'}
            </T>
            {view === 'paused' && (
              <T muted style={{ fontSize: 14, textAlign: 'center' }}>
                Bạn vẫn gửi lời chúc được như thường.
              </T>
            )}
          </Card>
        ) : (
          <Card style={{ gap: 16, padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <T style={{ fontWeight: '700' }}>Giấc ngủ của {other}</T>
              <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: C.well }} accessibilityRole="radiogroup">
                {([7, 30] as const).map((r) => (
                  <Pressable
                    key={r}
                    accessibilityRole="radio"
                    accessibilityLabel={`${r} ngày`}
                    accessibilityState={{ checked: range === r }}
                    onPress={() => setRange(r)}
                    style={{
                      minWidth: 56,
                      height: 44,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundImage: range === r ? 'linear-gradient(180deg, #B3BEFF, #7C8CF8)' : undefined,
                    }}>
                    <T style={{ fontSize: 14, fontWeight: '600', color: range === r ? C.bg : C.muted }}>{r} ngày</T>
                  </Pressable>
                ))}
              </View>
            </View>
            <SleepChart days={fillDays(from, today, logs)} />
            <T muted style={{ fontSize: 12, lineHeight: 18 }}>
              Mỗi thanh: từ lúc lên giường tới lúc dậy. Bên dưới: cảm nhận buổi sáng.
              {view === 'offline' ? '\nKhông tải được, kiểm tra mạng nhé.' : ''}
            </T>
          </Card>
        )}

        <Button3D label="Lời chúc ngủ ngon" onPress={() => router.push('/notes')} />
        <Button3D
          label="Khung cảnh & từ gốc"
          variant="secondary"
          onPress={() => router.push({ pathname: '/notes', params: { kind: 'scene' } })}
        />
      </ScrollView>
    </Screen>
  );
}

export default function Home() {
  return getSetting('role') === 'sleeper' ? <SleeperHome /> : <PartnerHome />;
}
