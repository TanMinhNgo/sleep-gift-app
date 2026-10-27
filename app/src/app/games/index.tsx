import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { BackButton, Card, GameOrb, Screen, T, Title } from '@/components/night';
import { GAMES } from '@/lib/games';

export default function Games() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <BackButton />
          <Title>Trò chơi ru ngủ</Title>
        </View>
        <T muted style={{ lineHeight: 24, marginBottom: 8 }}>
          Nhắm mắt, nghe giọng đọc. Không điểm số, không thắng thua.
        </T>
        {GAMES.map((g) => (
          <Pressable
            key={g.id}
            accessibilityRole="button"
            accessibilityLabel={g.name}
            accessibilityHint={g.desc}
            onPress={() => router.push({ pathname: '/games/[id]', params: { id: g.id } })}>
            {({ pressed }) => (
              <Card
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  borderRadius: 24,
                  transform: [{ perspective: 900 }, { rotateX: pressed ? '0deg' : '5deg' }, { translateY: pressed ? 3 : 0 }],
                }}>
                <GameOrb id={g.id} size={52} />
                <View style={{ flex: 1, gap: 3 }}>
                  <T style={{ fontSize: 17, fontWeight: '700' }}>{g.name}</T>
                  <T muted style={{ fontSize: 13, lineHeight: 19 }}>
                    {g.desc}
                  </T>
                </View>
              </Card>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
