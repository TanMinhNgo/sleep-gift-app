import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Moon3D } from '@/components/moon-3d';
import { C, Card, RoundButton, Screen, T } from '@/components/night';
import { api } from '@/lib/api';
import { getSetting } from '@/lib/settings';
import type { Me } from '@/lib/types';

// Màn chính tạm của Phase 2; nhật ký và trò chơi lấp vào ở Phase 3–4.
export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const wake = getSetting('wake_time');

  useFocusEffect(
    useCallback(() => {
      api<Me>('GET', '/me')
        .then(setMe)
        .catch(() => {}); // mất mạng: vẫn hiện màn, không báo lỗi to (spec mục 8)
    }, [])
  );

  const status = !me
    ? null
    : me.other
      ? `Đã ghép đôi với ${me.other.name}`
      : 'Đang chờ người ấy tham gia';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <T muted>Xin chào,</T>
          <T accessibilityRole="header" style={{ fontSize: 30, fontWeight: '800', marginTop: 4 }}>
            {me?.name ?? ' '}
          </T>
        </View>
        <RoundButton label="Cài đặt" icon="⚙" onPress={() => router.push('/settings')} />
      </View>
      <Moon3D style={{ flex: 1 }} />
      {status && (
        <View
          style={{
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 14,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(159,227,198,0.12)',
          }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: me?.other ? C.green : C.gold }} />
          <T style={{ fontSize: 14, fontWeight: '600', color: '#BFF0DA' }}>{status}</T>
        </View>
      )}
      {getSetting('role') === 'sleeper' && wake && (
        <Card style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <T muted style={{ fontSize: 14, fontWeight: '600' }}>
              Giờ dậy
            </T>
            <T style={{ fontSize: 34, fontWeight: '800', color: C.gold, marginTop: 4 }}>{wake}</T>
          </View>
          <T muted style={{ fontSize: 13, maxWidth: 150, textAlign: 'right' }}>
            Mỗi ngày, kể cả cuối tuần
          </T>
        </Card>
      )}
    </Screen>
  );
}
