import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';

import { BackButton, Button3D, C, Card, ErrorText, Field, MoonOrb, Screen, T, Title } from '@/components/night';
import { api, errorMessage, normalizeCode } from '@/lib/api';
import { setToken } from '@/lib/session';
import { setSetting } from '@/lib/settings';
import type { JoinRes } from '@/lib/types';

export default function SleeperSetup() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chỉ gửi khi đủ 6 số để không đốt lượt thử của server bằng mã sai định dạng.
  const valid = code.length === 6 && name.trim().length >= 1;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<JoinRes>('POST', '/join', { code, name: name.trim() });
      await setToken(res.token);
      setSetting('role', 'sleeper');
      router.replace({ pathname: '/setup/consent', params: { partnerName: res.partnerName } });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <BackButton />
            <MoonOrb size={56} />
          </View>
          <View style={{ gap: 8, marginTop: 12 }}>
            <Title>Nhập mã kết nối</Title>
            <T muted>6 số từ người đồng hành của bạn.</T>
          </View>
          <Card style={{ gap: 18 }}>
            <View style={{ gap: 8 }}>
              <Field
                label="Mã kết nối"
                value={code}
                onChangeText={(t) => setCode(normalizeCode(t))}
                keyboardType="number-pad"
                placeholder="••••••"
                style={{ height: 76, fontSize: 34, fontWeight: '800', letterSpacing: 12, textAlign: 'center', color: C.gold }}
              />
              {code.length > 0 && code.length < 6 && (
                <T muted style={{ fontSize: 13 }}>
                  Còn thiếu {6 - code.length} số
                </T>
              )}
            </View>
            <Field label="Tên của bạn" value={name} onChangeText={setName} maxLength={50} placeholder="Ví dụ: Linh" />
          </Card>
          <ErrorText>{error}</ErrorText>
          <View style={{ flex: 1 }} />
          <Button3D label={busy ? 'Đang kết nối…' : 'Tiếp tục'} onPress={submit} disabled={!valid || busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
