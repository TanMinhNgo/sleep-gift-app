import { useState } from 'react';
import { KeyboardAvoidingView, TextInput, View } from 'react-native';

import { BackButton, C, Card, Screen, T, Title } from '@/components/night';
import { addDays, localDate } from '@/lib/sleep';
import { getBrainDump, setBrainDump } from '@/lib/store';

export default function BrainDump() {
  const tomorrow = addDays(localDate(new Date()), 1);
  const [text, setText] = useState(() => getBrainDump(tomorrow));

  return (
    <Screen>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <BackButton />
          <Title>Xả não</Title>
        </View>
        <T muted style={{ lineHeight: 24 }}>
          Viết ra việc cần làm ngày mai. Viết xong là để nó ở đây, không cần nghĩ tiếp nữa.
        </T>
        <Card style={{ flex: 1, padding: 6 }}>
          <TextInput
            accessibilityLabel="Việc cần làm ngày mai"
            multiline
            autoFocus
            value={text}
            onChangeText={(t) => {
              setText(t);
              setBrainDump(tomorrow, t); // lưu ngay, SQLite đồng bộ nên không cần debounce
            }}
            placeholder="- Gọi điện cho…"
            placeholderTextColor="#8088B0"
            selectionColor={C.accent}
            style={{ flex: 1, color: C.text, fontSize: 17, lineHeight: 26, padding: 16, textAlignVertical: 'top' }}
          />
        </Card>
        <T muted style={{ fontSize: 13, textAlign: 'center' }}>
          Chỉ lưu trên máy này.
        </T>
      </KeyboardAvoidingView>
    </Screen>
  );
}
