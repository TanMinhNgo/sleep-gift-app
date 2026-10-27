import { createHash, randomBytes, randomInt } from 'node:crypto';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function newInviteCode(): string {
  return randomInt(1_000_000).toString().padStart(6, '0');
}
