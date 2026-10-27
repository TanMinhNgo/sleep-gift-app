import * as Brightness from 'expo-brightness';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StatusBar, Text, View } from 'react-native';

import { buildScript, GAMES, SCENES, splitScene, type GameId } from '@/lib/games';
import { createPlayer } from '@/lib/player';
import { notesOfKind } from '@/lib/store';

const DIM = '#5E6486';

export default function Play() {
  const { game, scene, ms } = useLocalSearchParams<{ game: GameId; scene?: string; ms?: string }>();
  const name = GAMES.find((g) => g.id === game)?.name ?? '';
  const [pulse] = useState(() => new Animated.Value(0.82));
  useKeepAwake();

  useEffect(() => {
    // Độ sáng tối thiểu khi chơi, trả lại như cũ khi rời màn.
    let before: number | null = null;
    Brightness.getBrightnessAsync()
      .then((b) => {
        before = b;
        return Brightness.setBrightnessAsync(0.01);
      })
      .catch(() => {});

    let lines: string[] | undefined;
    if (scene?.startsWith('note:')) {
      const n = notesOfKind('scene').find((x) => `note:${x.id}` === scene);
      lines = n ? splitScene(n.text) : undefined;
    } else if (scene) lines = SCENES.find((s) => s.id === scene)?.lines;

    const player = createPlayer({
      steps: buildScript(GAMES.some((g) => g.id === game) ? game : 'breath', { rng: Math.random, extraWords: notesOfKind('word').map((n) => n.text), scene: lines }),
      speak: (text, v, onDone) =>
        Speech.speak(text, {
          language: 'vi-VN',
          rate: v.rate,
          volume: v.volume,
          useApplicationAudioSession: false,
          onDone,
          onError: onDone, // lỗi một câu thì đọc câu sau, không đứng hình
        }),
      stop: () => Speech.stop(),
      onEnd: () => router.replace('/games/awake'),
      // chỉ để thử nhanh khi dev: /games/play?ms=60000
      durationMs: __DEV__ && ms ? Number(ms) : undefined,
    });
    player.start();

    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      const ease = Easing.inOut(Easing.sin);
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 4000, easing: ease, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.82, duration: 6000, easing: ease, useNativeDriver: true }),
        ])
      );
      loop.start();
    });

    return () => {
      player.cancel();
      loop?.stop();
      if (before != null) Brightness.setBrightnessAsync(before).catch(() => {});
    };
  }, [game, scene, ms, pulse]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', paddingTop: 80, paddingBottom: 56 }}>
      <StatusBar hidden />
      <Text style={{ color: DIM, fontSize: 15, fontWeight: '600' }}>{name}</Text>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 36 }}>
        <Animated.View
          accessible={false}
          style={{
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundImage: 'radial-gradient(circle at 40% 35%, #2A3060, #12152C 70%)',
            opacity: pulse.interpolate({ inputRange: [0.82, 1], outputRange: [0.35, 0.6] }),
            transform: [{ scale: pulse }],
          }}
        />
        <Text style={{ color: DIM, fontSize: 18, lineHeight: 29, textAlign: 'center' }}>
          Cứ nhắm mắt lại.{'\n'}Giọng đọc sẽ dẫn bạn đi.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dừng trò chơi"
        onPress={() => router.back()}
        style={{ height: 52, paddingHorizontal: 32, borderRadius: 26, borderWidth: 1, borderColor: '#23263A', justifyContent: 'center' }}>
        <Text style={{ color: DIM, fontSize: 16, fontWeight: '600' }}>Dừng</Text>
      </Pressable>
    </View>
  );
}
