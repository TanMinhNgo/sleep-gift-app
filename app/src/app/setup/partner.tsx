import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';

import { BackButton, Button3D, Card, ErrorText, Field, InviteCode, Screen, T, Title } from '@/components/night';
import { api, errorMessage } from '@/lib/api';
import { resetTo } from '@/lib/nav';
import { setToken } from '@/lib/session';
import { setSetting } from '@/lib/settings';
import type { RegisterRes } from '@/lib/types';

export default function PartnerSetup() {
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<RegisterRes>('POST', '/register', { name: name.trim(), adminSecret: secret });
      await setToken(res.token);
      setSetting('role', 'partner');
      setCode(res.inviteCode);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (code) {
    return (
      <Screen style={{ justifyContent: 'center' }}>
        <T muted style={s.caps}>
          Mã kết nối
        </T>
        <Card style={{ alignItems: 'center', marginTop: 20, paddingVertical: 32 }}>
          <InviteCode code={code} />
          <T muted style={{ marginTop: 24, textAlign: 'center' }}>
            Gửi mã này cho người ấy, hạn 7 ngày.
          </T>
        </Card>
        <T muted style={{ marginTop: 28, textAlign: 'center', lineHeight: 24 }}>
          Người ấy mở app, chọn “Ghi nhật ký giấc ngủ” rồi nhập 6 số này.
        </T>
        <Button3D label="Xong" onPress={() => resetTo('/home')} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  const valid = name.trim().length >= 1 && name.trim().length <= 50 && secret.length > 0;
  return (
    <Screen>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, gap: 20 }} keyboardShouldPersistTaps="handled">
          <BackButton />
          <View style={{ gap: 8, marginTop: 12 }}>
            <Title>Người đồng hành</Title>
            <T muted>Đăng ký để tạo mã kết nối.</T>
          </View>
          <Card style={{ gap: 18 }}>
            <Field label="Tên của bạn" value={name} onChangeText={setName} maxLength={50} placeholder="Ví dụ: An" />
            <Field label="Admin secret" value={secret} onChangeText={setSecret} secureTextEntry autoCapitalize="none" />
          </Card>
          <T muted style={{ fontSize: 13 }}>
            Đăng ký lại trên máy mới sẽ đăng xuất máy cũ.
          </T>
          <ErrorText>{error}</ErrorText>
          <View style={{ flex: 1 }} />
          <Button3D label={busy ? 'Đang tạo…' : 'Tạo mã kết nối'} onPress={submit} disabled={!valid || busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  caps: { textAlign: 'center', fontSize: 15, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
});
