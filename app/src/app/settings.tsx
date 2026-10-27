import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, Switch, View } from 'react-native';

import { BackButton, Button3D, C, Card, ErrorText, InviteCode, Screen, T, Title } from '@/components/night';
import { api, errorMessage } from '@/lib/api';
import { REMINDER_TYPES, scheduleReminders, type ReminderType } from '@/lib/reminders';
import { getSetting, setSetting } from '@/lib/settings';
import type { InviteRes, Me } from '@/lib/types';

const REMINDER_LABEL: Record<ReminderType, string> = {
  caffeine: 'Ly cà phê cuối (−6 giờ)',
  screen: 'Giảm sáng màn hình (−1 giờ)',
  braindump: 'Xả não (−45 phút)',
  bed: 'Đi ngủ kèm lời chúc (−30 phút)',
};

function Reminders() {
  const [off, setOff] = useState(() => (getSetting('reminders_off') ?? '').split(',').filter(Boolean));
  const [granted, setGranted] = useState<boolean | null>(null);
  useFocusEffect(
    useCallback(() => {
      Notifications.getPermissionsAsync().then((p) => setGranted(p.granted));
    }, [])
  );

  function toggle(t: ReminderType, on: boolean) {
    const next = on ? off.filter((x) => x !== t) : [...off, t];
    setOff(next);
    setSetting('reminders_off', next.join(','));
    scheduleReminders();
  }

  return (
    <>
      <T muted style={{ fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginTop: 8 }}>
        Nhắc buổi tối
      </T>
      {granted === false && (
        <Card style={{ gap: 12, boxShadow: `0 0 0 2px ${C.gold}` }}>
          <T style={{ lineHeight: 24 }}>
            Thông báo đang tắt. Bật trong Cài đặt › Ngủ Ngon › Thông báo. Nếu dùng chế độ Tập trung, thêm Ngủ Ngon vào danh sách được phép.
          </T>
          <Button3D label="Mở Cài đặt" variant="secondary" onPress={() => Linking.openSettings()} />
        </Card>
      )}
      <Card style={{ gap: 14 }}>
        {REMINDER_TYPES.map((t) => (
          <View key={t} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <T style={{ flex: 1 }}>{REMINDER_LABEL[t]}</T>
            <Switch
              accessibilityLabel={REMINDER_LABEL[t]}
              value={!off.includes(t)}
              onValueChange={(on) => toggle(t, on)}
              trackColor={{ true: '#4FB592', false: C.well }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </Card>
    </>
  );
}

export default function Settings() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const wake = getSetting('wake_time');

  useFocusEffect(
    useCallback(() => {
      api<Me>('GET', '/me')
        .then(setMe)
        .catch((e) => setError(errorMessage(e)));
    }, [])
  );

  async function toggle(next: boolean) {
    if (!me) return;
    const prev = me;
    setMe({ ...me, sharing_enabled: next }); // gạt ngay cho mượt; lỗi thì trả về
    setError(null);
    try {
      setMe(await api<Me>('PATCH', '/me', { sharing_enabled: next }));
    } catch (e) {
      setMe(prev);
      setError(errorMessage(e));
    }
  }

  async function newInvite() {
    setBusy(true);
    setError(null);
    try {
      setCode((await api<InviteRes>('POST', '/invites')).inviteCode);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const other = me?.other?.name ?? 'người đồng hành';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <BackButton />
          <Title>Cài đặt</Title>
        </View>

        {me?.role === 'sleeper' && (
          <>
            <Card style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <T style={{ flex: 1, fontSize: 20, fontWeight: '700', lineHeight: 28 }}>
                  {me.sharing_enabled ? `Đang chia sẻ nhật ký với ${other}` : 'Đang không chia sẻ nhật ký'}
                </T>
                <Switch
                  accessibilityLabel="Chia sẻ nhật ký"
                  value={me.sharing_enabled}
                  onValueChange={toggle}
                  trackColor={{ true: '#4FB592', false: C.well }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <T muted style={{ fontSize: 14, lineHeight: 22 }}>
                {me.sharing_enabled
                  ? `${other} xem được giờ ngủ, giờ dậy và cảm nhận buổi sáng của bạn.`
                  : `${other} sẽ thấy bạn đang tạm ngừng chia sẻ.`}
              </T>
            </Card>
            <Pressable accessibilityRole="button" accessibilityLabel={`Giờ dậy ${wake ?? ''}`} onPress={() => router.push({ pathname: '/setup/wake', params: { from: 'settings' } })}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 }}>
                <T style={{ fontWeight: '600' }}>Giờ dậy</T>
                <T style={{ fontSize: 17, fontWeight: '700', color: C.gold }}>{wake ?? '—'} ›</T>
              </Card>
            </Pressable>
            <Reminders />
          </>
        )}

        {me?.role === 'partner' && (
          <>
            <Card style={{ gap: 8 }}>
              <T style={{ fontSize: 20, fontWeight: '700', lineHeight: 28 }}>
                {!me.other
                  ? 'Đang chờ người ấy tham gia'
                  : me.other.sharing_enabled
                    ? `${me.other.name} đang chia sẻ nhật ký`
                    : `${me.other.name} đang tạm ngừng chia sẻ`}
              </T>
            </Card>
            {code ? (
              <Card style={{ alignItems: 'center', gap: 20, paddingVertical: 28 }}>
                <InviteCode code={code} />
                <T muted style={{ textAlign: 'center' }}>
                  Dùng khi người ấy cài lại app hoặc đổi máy.
                </T>
              </Card>
            ) : (
              <Button3D label={busy ? 'Đang tạo…' : 'Tạo mã kết nối mới'} variant="secondary" onPress={newInvite} disabled={busy} />
            )}
          </>
        )}

        <ErrorText>{error}</ErrorText>
      </ScrollView>
    </Screen>
  );
}
