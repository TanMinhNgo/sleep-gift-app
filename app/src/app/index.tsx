import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { nextRoute } from '@/lib/onboarding';
import { getToken } from '@/lib/session';
import { getSetting } from '@/lib/settings';
import type { Role } from '@/lib/types';

export default function Index() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    getToken().then(setToken);
  }, []);
  if (token === undefined) return null;

  const href = nextRoute({
    token,
    role: getSetting('role') as Role | null,
    consentDone: getSetting('consent_done') === '1',
    screeningDone: getSetting('screening_done') === '1',
    wakeTime: getSetting('wake_time'),
  });
  return <Redirect href={href} />;
}
