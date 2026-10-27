// Bộ giao diện "đêm nhung 3D" dùng chung, khớp bản thiết kế (artifact Ngủ Ngon — giao diện).
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { GameId } from '@/lib/games';

export const C = {
  bg: '#0B1026',
  text: '#EEF0FF',
  muted: '#A9B1D6',
  gold: '#FFE29C',
  accent: '#8B9CFF',
  well: '#0C1129',
  green: '#7EE0B5',
  danger: '#FFB4B4',
};

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView style={s.screen}>
      <View style={[s.screenInner, style]}>{children}</View>
    </SafeAreaView>
  );
}

export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[s.card, style]} />;
}

export function T({ muted, style, ...rest }: TextProps & { muted?: boolean }) {
  return <Text {...rest} style={[s.text, muted && { color: C.muted }, style]} />;
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <T accessibilityRole="header" style={s.title}>
      {children}
    </T>
  );
}

export function Button3D({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const p = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        p ? s.btnP : s.btnS,
        pressed && { transform: [{ translateY: 4 }], boxShadow: p ? SH.btnPDown : SH.btnSDown },
        disabled && { opacity: 0.45 },
        style,
      ]}>
      <Text style={[s.btnText, { color: p ? C.bg : C.text }]}>{label}</Text>
    </Pressable>
  );
}

export function BackButton() {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={s.round}>
      <Text style={s.roundIcon}>‹</Text>
    </Pressable>
  );
}

export function RoundButton({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [s.round, pressed && { transform: [{ translateY: 3 }] }]}>
      <Text style={s.roundIcon}>{icon}</Text>
    </Pressable>
  );
}

export function Field({ label, ...rest }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <T muted style={s.label}>
        {label}
      </T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8088B0"
        selectionColor={C.accent}
        {...rest}
        style={[s.input, rest.style]}
      />
    </View>
  );
}

export function ErrorText({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <T accessibilityLiveRegion="polite" style={{ color: C.danger, fontSize: 15 }}>
      {children}
    </T>
  );
}

/** Dãy lựa chọn nhanh kiểu nút lõm; `60` hiển thị "60′+" khi `plusLast`. */
export function Chips({
  label,
  options,
  value,
  onChange,
  plusLast,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
  plusLast?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o, i) => {
        const on = o === value;
        const text = `${o}′${plusLast && i === options.length - 1 ? '+' : ''}`;
        return (
          <Pressable
            key={o}
            accessibilityRole="radio"
            accessibilityLabel={`${label}: ${o} phút`}
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o)}
            style={[s.chip, on && s.chipOn]}>
            <Text style={[s.chipText, on && { color: C.bg }]}>{text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Hàng "nhãn ……… [−] giá trị [+]". */
export function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <T style={{ fontWeight: '600', flexShrink: 1 }}>{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <RoundButton label={`${label}: giảm`} icon="−" onPress={onMinus} />
        <T accessibilityLiveRegion="polite" style={{ minWidth: 76, textAlign: 'center', fontSize: 22, fontWeight: '800', color: C.gold }}>
          {value}
        </T>
        <RoundButton label={`${label}: tăng`} icon="+" onPress={onPlus} />
      </View>
    </View>
  );
}

/** Cảm nhận 1–5 vẽ thành pha trăng; 0 = chưa ghi. */
export function MoonPhase({ n, size = 30 }: { n: number; size?: number }) {
  const base = { width: size, height: size, borderRadius: size / 2 };
  if (n <= 0) return <View style={[base, { borderWidth: 2, borderStyle: 'dashed', borderColor: '#4A5590' }]} />;
  if (n >= 5)
    return (
      <View
        style={[base, { backgroundImage: 'radial-gradient(circle at 35% 30%, #FFF8DF, #FFE29C 45%, #E7B45C)', boxShadow: '0 0 10px rgba(255,214,130,0.4)' }]}
      />
    );
  return <View style={[base, { backgroundColor: '#10163A', boxShadow: `inset ${Math.round((size * [0, 0.17, 0.3, 0.5, 0.73][n]))}px 0 0 ${C.gold}` }]} />;
}

const ORB: Record<GameId, string> = {
  shuffle: 'radial-gradient(circle at 32% 28%, #D6DCFF 0%, #8E9DFA 45%, #4B58B8 100%)',
  images: 'radial-gradient(circle at 32% 28%, #FFF3D1 0%, #FFCF7A 45%, #C08433 100%)',
  walk: 'radial-gradient(circle at 32% 28%, #DDF8EC 0%, #8FDDBC 45%, #3E9A78 100%)',
  awake: 'radial-gradient(circle at 32% 28%, #FFE1EA 0%, #F5A3BA 45%, #B5546F 100%)',
  breath: 'radial-gradient(circle at 32% 28%, #D9F2FF 0%, #8CCBF0 45%, #3A7FAE 100%)',
};

/** Quả cầu 3D riêng màu của từng trò chơi. */
export function GameOrb({ id, size }: { id: GameId; size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundImage: ORB[id],
        boxShadow: `inset -${size * 0.08}px -${size * 0.11}px ${size * 0.2}px rgba(10,20,60,0.45), 0 8px 18px rgba(0,0,0,0.35)`,
      }}
    />
  );
}

export function InviteCode({ code }: { code: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }} accessible accessibilityLabel={`Mã kết nối ${code.split('').join(' ')}`}>
      {code.split('').map((d, i) => (
        <Text key={i} style={[s.tile, i === 3 && { marginLeft: 10 }]}>
          {d}
        </Text>
      ))}
    </View>
  );
}

/** Mặt trăng 2D vẽ bằng gradient — dùng ở chỗ nhỏ, chỗ lớn dùng Moon3D. */
export function MoonOrb({ size }: { size: number }) {
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundImage: 'radial-gradient(circle at 34% 30%, #FFF8DF 0%, #FFE29C 38%, #E7B45C 72%, #B9822F 100%)',
        boxShadow: `0 0 ${size * 0.4}px rgba(255,214,130,0.35), inset -${size * 0.1}px -${size * 0.12}px ${size * 0.2}px rgba(110,62,8,0.45)`,
      }}
    />
  );
}

const SH = {
  btnP: 'inset 0 2px 0 rgba(255,255,255,0.55), 0 6px 0 #4C59BE, 0 16px 30px rgba(96,112,240,0.45)',
  btnPDown: 'inset 0 2px 0 rgba(255,255,255,0.55), 0 2px 0 #4C59BE, 0 8px 16px rgba(96,112,240,0.4)',
  btnS: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 6px 0 #10163A, 0 14px 26px rgba(2,4,16,0.55)',
  btnSDown: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 2px 0 #10163A, 0 6px 12px rgba(2,4,16,0.55)',
};

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
    backgroundImage: 'radial-gradient(120% 60% at 50% 0%, #1B2457 0%, #0B1026 55%, #070B1E 100%)',
  },
  screenInner: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  card: {
    borderRadius: 28,
    padding: 22,
    backgroundImage: 'linear-gradient(160deg, #252E62 0%, #171E44 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 5px 0 #0D1230, 0 22px 40px rgba(2,4,16,0.65)',
  },
  text: { color: C.text, fontSize: 16 },
  title: { fontSize: 30, fontWeight: '800', color: C.text },
  label: { fontSize: 14, fontWeight: '600' },
  btn: { height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  btnP: { backgroundImage: 'linear-gradient(180deg, #B3BEFF, #7C8CF8)', boxShadow: SH.btnP },
  btnS: { backgroundImage: 'linear-gradient(180deg, #2C366E, #1F2752)', boxShadow: SH.btnS },
  btnText: { fontSize: 17, fontWeight: '700' },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: 'linear-gradient(180deg, #2C366E, #1F2752)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 4px 0 #10163A, 0 10px 20px rgba(2,4,16,0.55)',
  },
  roundIcon: { color: C.text, fontSize: 28, lineHeight: 30, fontWeight: '600' },
  chip: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.well, boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)' },
  chipOn: { backgroundImage: 'linear-gradient(180deg, #B3BEFF, #7C8CF8)', boxShadow: '0 3px 0 #4C59BE' },
  chipText: { color: C.muted, fontSize: 14, fontWeight: '600' },
  tile: {
    width: 44,
    height: 62,
    lineHeight: 62,
    textAlign: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    fontSize: 30,
    fontWeight: '800',
    color: C.gold,
    backgroundImage: 'linear-gradient(180deg, #323E7A, #1D2550)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 5px 0 #0D1230',
  },
  input: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 17,
    color: C.text,
    backgroundColor: C.well,
    boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.6)',
  },
});
