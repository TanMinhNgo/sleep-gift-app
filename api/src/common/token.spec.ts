import { hashToken, newInviteCode, newToken } from './token';

it('creates random bearer tokens and stores only their SHA-256 digest', () => {
  const a = newToken();
  expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(a.hash).toBe(hashToken(a.token));
  expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
  expect(newToken().token).not.toBe(a.token);
  expect(hashToken('abc')).toBe(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
  expect(newInviteCode()).toMatch(/^\d{6}$/);
});
