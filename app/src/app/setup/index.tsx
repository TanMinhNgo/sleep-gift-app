import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Moon3D } from '@/components/moon-3d';
import { C, Card, Screen, T } from '@/components/night';

function RoleCard({ title, hint, onPress }: { title: string; hint: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={hint} onPress={onPress}>
      {({ pressed }) => (
        <Card style={[s.role, pressed && { transform: [{ translateY: 3 }] }]}>
          <View style={{ flex: 1, gap: 4 }}>
            <T style={s.roleTitle}>{title}</T>
            <T muted style={{ fontSize: 14 }}>
              {hint}
            </T>
          </View>
          <T muted style={{ fontSize: 26 }}>
            ›
          </T>
        </Card>
      )}
    </Pressable>
  );
}

export default function ChooseRole() {
  return (
    <Screen>
      <Moon3D style={s.moon} />
      <T accessibilityRole="header" style={s.title}>
        Ngủ Ngon
      </T>
      <T muted style={s.tagline}>
        Nhật ký giấc ngủ mỗi sáng,{'\n'}ngủ đều hơn mỗi tối.
      </T>
      <View style={{ gap: 18, marginTop: 28 }}>
        <RoleCard
          title="Ghi nhật ký giấc ngủ"
          hint="Theo dõi giấc ngủ của bạn"
          onPress={() => router.push('/setup/sleeper')}
        />
        <RoleCard title="Người đồng hành" hint="Gửi lời chúc ngủ ngon" onPress={() => router.push('/setup/partner')} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  moon: { flex: 1, minHeight: 260 },
  title: { fontSize: 40, fontWeight: '800', textAlign: 'center', color: C.text },
  tagline: { fontSize: 17, textAlign: 'center', lineHeight: 26, marginTop: 8 },
  role: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, transform: [{ perspective: 900 }, { rotateX: '6deg' }] },
  roleTitle: { fontSize: 18, fontWeight: '700' },
});
