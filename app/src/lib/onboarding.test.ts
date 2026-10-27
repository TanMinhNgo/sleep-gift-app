import { nextRoute } from './onboarding';

const done = { token: 't', role: 'sleeper', consentDone: true, screeningDone: true, wakeTime: '06:30' } as const;

it('no token → setup', () => {
  expect(nextRoute({ ...done, token: null })).toBe('/setup');
});

it('partner with token → home', () => {
  expect(
    nextRoute({ token: 't', role: 'partner', consentDone: false, screeningDone: false, wakeTime: null })
  ).toBe('/home');
});

it('resumes at consent', () => {
  expect(nextRoute({ ...done, consentDone: false, screeningDone: false, wakeTime: null })).toBe('/setup/consent');
});

it('then screening, then wake', () => {
  expect(nextRoute({ ...done, screeningDone: false, wakeTime: null })).toBe('/setup/screening');
  expect(nextRoute({ ...done, wakeTime: null })).toBe('/setup/wake');
});

it('all done → home', () => {
  expect(nextRoute(done)).toBe('/home');
});
