import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button3D, C, Card, Screen, T, Title } from '@/components/night';
import { setSetting } from '@/lib/settings';

const QUESTIONS = [
  { q: 'Động kinh' },
  { q: 'Rối loạn lưỡng cực' },
  { q: 'Đang mang thai' },
  { q: 'Nghi ngưng thở khi ngủ', hint: 'Ngáy to, nghẹt thở khi ngủ' },
];

function YesNo({ label, value, onChange }: { label: string; value?: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.seg}>
      {[true, false].map((v) => (
        <Pressable
          key={String(v)}
          accessibilityRole="radio"
          accessibilityLabel={`${label}: ${v ? 'Có' : 'Không'}`}
          accessibilityState={{ checked: value === v }}
          onPress={() => onChange(v)}
          style={[s.pill, value === v && s.pillOn]}>
          <T style={[s.pillText, value === v && { color: C.bg }]}>{v ? 'Có' : 'Không'}</T>
        </Pressable>
      ))}
    </View>
  );
}

export default function Screening() {
  const [answers, setAnswers] = useState<(boolean | undefined)[]>(QUESTIONS.map(() => undefined));
  const [flagged, setFlagged] = useState(false);
  // Bắt trả lời đủ, không chọn sẵn "Không" để khỏi lướt qua.
  const allAnswered = answers.every((a) => a !== undefined);

  function next() {
    if (flagged) return router.replace('/setup/wake');
    const any = answers.some(Boolean);
    setSetting('restriction_allowed', any ? '0' : '1');
    setSetting('screening_done', '1');
    if (any) setFlagged(true);
    else router.replace('/setup/wake');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ flexGrow: 1, gap: 14 }}>
        <Title>Vài câu hỏi an toàn</Title>
        <T muted style={{ lineHeight: 24, marginBottom: 8 }}>
          Bạn có đang gặp điều nào dưới đây? Câu trả lời chỉ lưu trên máy này.
        </T>
        {QUESTIONS.map(({ q, hint }, i) => (
          <Card key={q} style={s.row}>
            <View style={{ flex: 1, gap: 3 }}>
              <T style={{ fontWeight: '600' }}>{q}</T>
              {hint && (
                <T muted style={{ fontSize: 13 }}>
                  {hint}
                </T>
              )}
            </View>
            <YesNo
              label={q}
              value={answers[i]}
              onChange={(v) => !flagged && setAnswers((a) => a.map((x, j) => (j === i ? v : x)))}
            />
          </Card>
        ))}
        {flagged && (
          <Card style={{ boxShadow: `0 0 0 2px ${C.gold}` }}>
            <T accessibilityLiveRegion="polite" style={{ lineHeight: 24 }}>
              Tính năng siết giờ ngủ sẽ tắt. Bạn nên đi khám bác sĩ về giấc ngủ.
            </T>
          </Card>
        )}
        <View style={{ flex: 1 }} />
        <Button3D label={flagged ? 'Đã hiểu, tiếp tục' : 'Tiếp tục'} onPress={next} disabled={!allAnswered} />
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingRight: 14, paddingLeft: 18, borderRadius: 24 },
  seg: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 16, backgroundColor: C.well, boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.6)' },
  pill: { minWidth: 60, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  pillOn: { backgroundImage: 'linear-gradient(180deg, #B3BEFF, #7C8CF8)', boxShadow: '0 3px 0 #4C59BE' },
  pillText: { fontSize: 15, fontWeight: '600', color: C.muted },
});
