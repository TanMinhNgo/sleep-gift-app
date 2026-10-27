import type { Role } from './types';

export type SetupState = {
  token: string | null;
  role: Role | null;
  consentDone: boolean;
  screeningDone: boolean;
  wakeTime: string | null;
};

export function nextRoute(s: SetupState) {
  if (!s.token || !s.role) return '/setup';
  if (s.role === 'partner') return '/home';
  if (!s.consentDone) return '/setup/consent';
  if (!s.screeningDone) return '/setup/screening';
  if (!s.wakeTime) return '/setup/wake';
  return '/home';
}
