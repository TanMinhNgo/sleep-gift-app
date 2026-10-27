import { StatusBar, Text, View } from 'react-native';

import { Button3D } from '@/components/night';
import { resetTo } from '@/lib/nav';

const STEPS = ['Ra khỏi giường một lúc.', 'Làm việc gì đó nhẹ nhàng dưới ánh sáng mờ.', 'Buồn ngủ lại thì quay vào giường.'];
const WARM = '#D8C8AA';

// Kiểm soát kích thích: sau 20 phút còn thức thì rời giường, không nằm trằn trọc.
export default function StillAwake() {
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 96,
        paddingBottom: 44,
        backgroundColor: '#000',
        backgroundImage: 'radial-gradient(90% 50% at 50% 30%, #1A140C 0%, #000 70%)',
      }}>
      <StatusBar hidden />
      <View
        accessible={false}
        style={{
          alignSelf: 'center',
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundImage: 'radial-gradient(circle at 40% 35%, #FFD9A0, #C98A3A 60%, #5A3A14 100%)',
          boxShadow: '0 0 50px rgba(220,150,70,0.3)',
        }}
      />
      <Text accessibilityRole="header" style={{ marginTop: 32, color: WARM, fontSize: 24, fontWeight: '700', textAlign: 'center' }}>
        Mình vẫn chưa ngủ được?
      </Text>
      <Text style={{ marginTop: 10, color: '#B8AD96', fontSize: 15, textAlign: 'center' }}>Không sao cả. Thử thế này nhé:</Text>
      <View style={{ marginTop: 28, gap: 12 }}>
        {STEPS.map((s, i) => (
          <View key={s} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: 16, borderRadius: 20, backgroundColor: '#0F0C08' }}>
            <Text style={{ width: 28, height: 28, lineHeight: 28, borderRadius: 14, overflow: 'hidden', textAlign: 'center', backgroundColor: '#2A2014', color: WARM, fontWeight: '700' }}>
              {i + 1}
            </Text>
            <Text style={{ flex: 1, color: '#B8AD96', fontSize: 16, lineHeight: 24 }}>{s}</Text>
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <Button3D label="Đã hiểu" variant="secondary" onPress={() => resetTo('/home')} />
    </View>
  );
}
