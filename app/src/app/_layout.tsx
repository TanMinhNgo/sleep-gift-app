import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { C } from '@/components/night';
import { setUnauthorizedHandler } from '@/lib/api';
import { migrate } from '@/lib/db';
import { resetTo } from '@/lib/nav';
import { clearToken } from '@/lib/session';

migrate();
// Token bị thu hồi (máy khác join/register lại): về thiết lập, giữ nguyên SQLite.
setUnauthorizedHandler(() => {
  clearToken();
  resetTo('/setup');
});

export default function RootLayout() {
  return (
    <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: C.bg } }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
    </ThemeProvider>
  );
}
