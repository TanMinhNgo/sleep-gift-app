import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button3D, C, Card, RoundButton, Screen, T, Title } from '@/components/night';
import { resetTo } from '@/lib/nav';
import { getSetting, setSetting } from '@/lib/settings';
import { stepTime } from '@/lib/time';

export default function Wake() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [time, setTime] = useState(getSetting('wake_time') ?? '06:30');

  function done() {
    setSetting('wake_time', time);
    // canGoBack() không phân biệt được: lúc onboarding bên dưới vẫn còn màn chọn vai.
    if (from === 'settings') router.back();
    else resetTo('/home');
  }

  return (
    <Screen style={{ alignItems: 'center' }}>
      <View style={s.sun} accessible={false} />
      <View style={{ marginTop: 28, alignItems: 'center', gap: 8 }}>
        <Title>Giờ dậy cố định</Title>
        <T muted style={{ textAlign: 'center' }}>
          Dậy cùng một giờ mỗi ngày, kể cả cuối tuần.
        </T>
      </View>
      <Card style={s.picker}>
        <RoundButton label="Sớm hơn 15 phút" icon="−" onPress={() => setTime((t) => stepTime(t, -15))} />
        <View style={s.well}>
          <T accessibilityLiveRegion="polite" accessibilityLabel={`Giờ dậy ${time}`} style={s.time}>
            {time}
          </T>
        </View>
        <RoundButton label="Muộn hơn 15 phút" icon="+" onPress={() => setTime((t) => stepTime(t, 15))} />
      </Card>
      <View style={s.tip}>
        <T style={{ lineHeight: 24 }}>Đặt báo thức lặp lại hằng ngày lúc {time} trong app Đồng hồ, kể cả cuối tuần.</T>
      </View>
      <View style={{ flex: 1 }} />
      <Button3D label="Xong" onPress={done} style={{ alignSelf: 'stretch' }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  sun: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginTop: 24,
    backgroundImage: 'radial-gradient(circle at 40% 35%, #FFF4D0, #FFC86B 50%, #F08A3C 100%)',
    boxShadow: '0 0 70px rgba(255,170,80,0.45), inset -8px -10px 18px rgba(150,60,10,0.4)',
  },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32, alignSelf: 'stretch', paddingHorizontal: 20 },
  well: {
    flex: 1,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.well,
    boxShadow: 'inset 0 6px 16px rgba(0,0,0,0.7)',
  },
  time: { fontSize: 48, fontWeight: '800', color: C.gold },
  tip: { marginTop: 28, alignSelf: 'stretch', padding: 18, borderRadius: 20, backgroundColor: 'rgba(139,156,255,0.1)' },
});
