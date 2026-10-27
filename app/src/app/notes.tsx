import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { BackButton, Button3D, C, Card, ErrorText, RoundButton, Screen, T, Title } from '@/components/night';
import { api, errorMessage } from '@/lib/api';
import { addDays, localDate } from '@/lib/sleep';
import type { Note } from '@/lib/types';

type Kind = Note['kind'];
const AHEAD = 60;
const TABS: { kind: Kind; label: string }[] = [
  { kind: 'goodnight', label: 'Lời chúc' },
  { kind: 'scene', label: 'Khung cảnh' },
  { kind: 'word', label: 'Từ gốc' },
];
const COPY: Record<Kind, { hint: string; placeholder: string; save: string; max: number }> = {
  goodnight: {
    hint: 'Lời chúc hiện trong thông báo đi ngủ tối đó, nếu người ấy mở app trong 7 ngày trước.',
    placeholder: 'Ngủ ngon nha…',
    save: 'Lưu lời chúc',
    max: 2000,
  },
  scene: {
    hint: 'Khung cảnh riêng cho trò Dạo bước. Mỗi câu (hoặc mỗi dòng) là một bước, giọng đọc dừng khoảng 12 giây giữa các câu. Tả âm thanh, mùi, ánh sáng.',
    placeholder: 'Bạn đang đi dọc con dốc ở Đà Lạt, sương còn mỏng…',
    save: 'Lưu khung cảnh',
    max: 2000,
  },
  word: {
    hint: 'Từ gốc thêm vào trò Xáo chữ, được đọc trong những từ đầu tiên. Chọn từ bình yên, không gợi lo lắng.',
    placeholder: 'đồi thông',
    save: 'Thêm từ',
    max: 30,
  },
};
const dayLabel = (date: string, today: string) =>
  date === today ? 'Tối nay' : date === addDays(today, 1) ? 'Tối mai' : `Tối ${date.slice(8)}/${date.slice(5, 7)}`;

export default function Notes() {
  const params = useLocalSearchParams<{ kind?: Kind }>();
  const today = localDate(new Date());
  const [kind, setKind] = useState<Kind>(params.kind ?? 'goodnight');
  const [notes, setNotes] = useState<Note[]>([]);
  const [date, setDate] = useState(today);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      // goodnight trong khoảng; scene/word luôn được trả đủ.
      api<Note[]>('GET', `/notes?from=${today}&to=${addDays(today, AHEAD)}`)
        .then(setNotes)
        .catch((e) => setError(errorMessage(e)));
    }, [today])
  );

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const body = kind === 'goodnight' ? { kind, text: text.trim(), show_on_date: date } : { kind, text: text.trim() };
      const n = await api<Note>('POST', '/notes', body);
      setNotes((xs) => [...xs, n]);
      setText('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api('DELETE', `/notes/${id}`);
      setNotes((xs) => xs.filter((n) => n.id !== id));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const copy = COPY[kind];
  const shown = notes
    .filter((n) => n.kind === kind)
    .sort((a, b) => (a.show_on_date ?? a.created_at ?? '').localeCompare(b.show_on_date ?? b.created_at ?? ''));
  const itemLabel = (n: Note) =>
    kind === 'goodnight' ? dayLabel(n.show_on_date ?? today, today) : kind === 'scene' ? 'Khung cảnh' : 'Từ gốc';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 18 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <BackButton />
          <Title>Gửi người ấy</Title>
        </View>

        <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 16, backgroundColor: C.well }} accessibilityRole="tablist">
          {TABS.map((t) => {
            const on = t.kind === kind;
            return (
              <Pressable
                key={t.kind}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  setKind(t.kind);
                  setText('');
                }}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundImage: on ? 'linear-gradient(180deg, #B3BEFF, #7C8CF8)' : undefined,
                  boxShadow: on ? '0 3px 0 #4C59BE' : undefined,
                }}>
                <T style={{ fontSize: 14, fontWeight: '600', color: on ? C.bg : C.muted }}>{t.label}</T>
              </Pressable>
            );
          })}
        </View>

        <Card style={{ gap: 16 }}>
          {kind === 'goodnight' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <RoundButton label="Ngày trước" icon="‹" onPress={() => date > today && setDate(addDays(date, -1))} />
              <T accessibilityLiveRegion="polite" style={{ fontSize: 20, fontWeight: '700', color: C.gold }}>
                {dayLabel(date, today)}
              </T>
              <RoundButton label="Ngày sau" icon="›" onPress={() => date < addDays(today, AHEAD) && setDate(addDays(date, 1))} />
            </View>
          )}
          <TextInput
            accessibilityLabel={TABS.find((t) => t.kind === kind)!.label}
            multiline={kind !== 'word'}
            maxLength={copy.max}
            value={text}
            onChangeText={setText}
            placeholder={copy.placeholder}
            placeholderTextColor="#8088B0"
            selectionColor={C.accent}
            style={{
              minHeight: kind === 'word' ? 56 : kind === 'scene' ? 180 : 110,
              borderRadius: 18,
              padding: 16,
              fontSize: 17,
              lineHeight: 24,
              color: C.text,
              backgroundColor: C.well,
              boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.6)',
              textAlignVertical: 'top',
            }}
          />
          {kind === 'scene' && (
            <T muted style={{ fontSize: 12, textAlign: 'right' }}>
              {text.length}/{copy.max}
            </T>
          )}
          <Button3D label={busy ? 'Đang lưu…' : copy.save} onPress={add} disabled={busy || !text.trim()} />
        </Card>
        <T muted style={{ fontSize: 13, lineHeight: 20 }}>
          {copy.hint}
        </T>
        <ErrorText>{error}</ErrorText>

        {shown.map((n) => (
          <Card key={n.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <T muted style={{ fontSize: 13, fontWeight: '600' }}>
                {itemLabel(n)}
              </T>
              <T style={{ lineHeight: 22 }} numberOfLines={kind === 'scene' ? 4 : undefined}>
                {n.text}
              </T>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Xoá ${itemLabel(n).toLowerCase()}`}
              onPress={() => remove(n.id)}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <T style={{ color: C.danger, fontSize: 20 }}>✕</T>
            </Pressable>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
