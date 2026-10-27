import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button3D, ErrorText, MoonOrb, Screen, T } from '@/components/night';
import { api, errorMessage } from '@/lib/api';
import { setSetting } from '@/lib/settings';
import type { Me } from '@/lib/types';

export default function Consent() {
  const params = useLocalSearchParams<{ partnerName?: string }>();
  const [partner, setPartner] = useState(params.partnerName ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mở lại app giữa chừng thì mất param → hỏi server.
  useEffect(() => {
    if (partner) return;
    api<Me>('GET', '/me')
      .then((me) => setPartner(me.other?.name ?? null))
      .catch((e) => setError(errorMessage(e)));
  }, [partner]);

  async function choose(sharing: boolean) {
    setBusy(true);
    setError(null);
    try {
      await api<Me>('PATCH', '/me', { sharing_enabled: sharing });
      setSetting('consent_done', '1');
      router.replace('/setup/screening');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen style={{ alignItems: 'stretch' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <MoonOrb size={140} />
        <T accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800', lineHeight: 36, textAlign: 'center', marginTop: 28 }}>
          Chia sẻ nhật ký giấc ngủ với {partner ?? '…'}?
        </T>
        <T muted style={{ textAlign: 'center', lineHeight: 24 }}>
          Bạn có thể tắt bất cứ lúc nào trong Cài đặt.
        </T>
      </View>
      <View style={{ gap: 16 }}>
        <ErrorText>{error}</ErrorText>
        <Button3D label="Có" onPress={() => choose(true)} disabled={busy || !partner} />
        <Button3D label="Không" variant="secondary" onPress={() => choose(false)} disabled={busy || !partner} />
        <T muted style={{ fontSize: 13, textAlign: 'center' }}>
          Chọn gì bạn cũng dùng app đầy đủ.
        </T>
      </View>
    </Screen>
  );
}
