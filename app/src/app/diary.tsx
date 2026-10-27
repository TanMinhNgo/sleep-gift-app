import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { BackButton, Button3D, C, Card, Chips, MoonPhase, Screen, Stepper, T, Title } from '@/components/night';
import { getSetting } from '@/lib/settings';
import { bedDateTime, bedTime, localDate, WINDOW_DEFAULT } from '@/lib/sleep';
import { getLog, saveLog } from '@/lib/store';
import { syncSleeper } from '@/lib/sync';
import { stepTime } from '@/lib/time';

const LATENCY = [5, 15, 30, 45, 60];
const AWAKE = [5, 15, 30, 60];
const FEELS = ['Mệt', 'Hơi mệt', 'Tạm', 'Khá', 'Khoẻ'];

const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function Diary() {
  const today = localDate(new Date());
  const [init] = useState(() => {
    const l = getLog(today);
    if (l) return { ...l, bed: hhmm(l.bed_time), wake: hhmm(l.wake_time) };
    const wake = getSetting('wake_time') ?? '06:30';
    const bed = bedTime(wake, Number(getSetting('window_min')) || WINDOW_DEFAULT);
    return { bed, wake, latency_min: 15, awakenings: 0, awake_min: 0, rating: 0 };
  });
  const [bed, setBed] = useState(init.bed);
  const [wake, setWake] = useState(init.wake);
  const [latency, setLatency] = useState(init.latency_min);
  const [awakenings, setAwakenings] = useState(init.awakenings);
  const [awakeMin, setAwakeMin] = useState(init.awake_min || 15);
  const [rating, setRating] = useState(init.rating);

  function save() {
    saveLog({
      date: today,
      ...bedDateTime(today, bed, wake),
      latency_min: latency,
      awakenings,
      awake_min: awakenings ? awakeMin : 0,
      rating,
    });
    syncSleeper(); // không chờ: mất mạng thì để dirty, lần mở app sau gửi tiếp
    router.back();
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 20, flexGrow: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <BackButton />
          <View>
            <Title>Nhật ký sáng</Title>
            <T muted style={{ fontSize: 14 }}>
              Sáng {today.slice(8)}/{today.slice(5, 7)}
            </T>
          </View>
        </View>

        <Card style={{ gap: 18 }}>
          <Stepper label="Lên giường" value={bed} onMinus={() => setBed(stepTime(bed, -15))} onPlus={() => setBed(stepTime(bed, 15))} />
          <View style={{ gap: 10 }}>
            <T style={{ fontWeight: '600' }}>Chờ ngủ bao lâu</T>
            <Chips label="Chờ ngủ" options={LATENCY} value={latency} onChange={setLatency} plusLast />
          </View>
          <Stepper
            label="Thức giấc giữa đêm"
            value={`${awakenings} lần`}
            onMinus={() => setAwakenings(Math.max(0, awakenings - 1))}
            onPlus={() => setAwakenings(Math.min(30, awakenings + 1))}
          />
          {awakenings > 0 && <Chips label="Thức tổng cộng" options={AWAKE} value={awakeMin} onChange={setAwakeMin} plusLast />}
          <Stepper label="Giờ dậy" value={wake} onMinus={() => setWake(stepTime(wake, -15))} onPlus={() => setWake(stepTime(wake, 15))} />
        </Card>

        <Card style={{ gap: 12, paddingHorizontal: 12 }}>
          <T style={{ fontWeight: '600', marginLeft: 4 }}>Sáng nay thấy thế nào?</T>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityRole="radiogroup">
            {FEELS.map((f, i) => {
              const on = rating === i + 1;
              return (
                <Pressable
                  key={f}
                  accessibilityRole="radio"
                  accessibilityLabel={`Cảm nhận ${i + 1} trên 5: ${f}`}
                  accessibilityState={{ checked: on }}
                  onPress={() => setRating(i + 1)}
                  style={{
                    width: 58,
                    paddingVertical: 8,
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 16,
                    backgroundColor: on ? C.well : 'transparent',
                    boxShadow: on ? `0 0 0 2px ${C.accent}` : undefined,
                  }}>
                  <MoonPhase n={i + 1} size={34} />
                  <T muted={!on} style={{ fontSize: 12, fontWeight: '600' }}>
                    {f}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <View style={{ flex: 1 }} />
        <Button3D label="Lưu nhật ký" onPress={save} disabled={!rating} />
      </ScrollView>
    </Screen>
  );
}
