import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { BackButton, Button3D, C, Card, GameOrb, Screen, T, Title } from '@/components/night';
import { GAMES, SCENES, type GameId } from '@/lib/games';
import { notesOfKind } from '@/lib/store';

export default function GameStart() {
  const { id } = useLocalSearchParams<{ id: GameId }>();
  const game = GAMES.find((g) => g.id === id) ?? GAMES[0];
  const own = game.id === 'walk' ? notesOfKind('scene') : [];
  const scenes = [
    ...SCENES.map((s) => ({ key: s.id, name: s.name, own: false })),
    ...own.map((n, i) => ({ key: `note:${n.id}`, name: own.length > 1 ? `Khung cảnh riêng ${i + 1}` : 'Khung cảnh riêng của bạn', own: true })),
  ];
  const [scene, setScene] = useState(scenes[0].key);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 20, flexGrow: 1 }}>
        <BackButton />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <GameOrb id={game.id} size={80} />
          <View style={{ flex: 1, gap: 4 }}>
            <Title>{game.name}</Title>
            <T muted style={{ fontSize: 14, lineHeight: 20 }}>
              {game.desc}
            </T>
          </View>
        </View>

        {game.id === 'walk' && (
          <Card style={{ gap: 8, padding: 12 }} accessibilityRole="radiogroup" accessibilityLabel="Khung cảnh">
            {scenes.map((s) => {
              const on = s.key === scene;
              return (
                <Pressable
                  key={s.key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={s.name}
                  onPress={() => setScene(s.key)}
                  style={{
                    minHeight: 56,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    paddingHorizontal: 16,
                    borderRadius: 18,
                    backgroundColor: on ? '#26306A' : C.well,
                    boxShadow: on ? '0 0 0 2px #8FDDBC' : 'inset 0 2px 6px rgba(0,0,0,0.6)',
                  }}>
                  <View
                    style={{ width: 20, height: 20, borderRadius: 10, borderWidth: on ? 6 : 2, borderColor: on ? '#8FDDBC' : '#6C76A6' }}
                  />
                  <T style={{ flex: 1, fontWeight: '600' }}>{s.name}</T>
                  {s.own && <T style={{ fontSize: 12, fontWeight: '700', color: C.gold }}>Riêng</T>}
                </Pressable>
              );
            })}
          </Card>
        )}

        <T muted style={{ lineHeight: 22 }}>
          Bấm bắt đầu là màn hình tối hẳn. Giọng đọc chậm và nhỏ dần, tự dừng sau 20 phút. Cứ nhắm mắt, không cần nhìn hay chạm.
        </T>
        <View style={{ flex: 1 }} />
        <Button3D
          label="Bắt đầu"
          onPress={() => router.push({ pathname: '/games/play', params: { game: game.id, scene: game.id === 'walk' ? scene : '' } })}
        />
      </ScrollView>
    </Screen>
  );
}
