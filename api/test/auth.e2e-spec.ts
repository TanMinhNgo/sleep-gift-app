import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { sql } from '../src/common/db';
import { hashToken } from '../src/common/token';
import { joinSleeper, makeApp, registerPartner, resetDb } from './helpers';

describe('Authentication (real Postgres)', () => {
  let app: INestApplication<Server>;
  beforeAll(async () => {
    app = await makeApp();
  });
  beforeEach(async () => {
    process.env.ADMIN_SECRET = 's3cret';
    await resetDb();
  });
  afterAll(async () => {
    await app?.close();
  });
  const join = (code: string, name = 'Em') =>
    request(app.getHttpServer()).post('/join').send({ code, name });
  const invites = (token: string) =>
    request(app.getHttpServer())
      .post('/invites')
      .auth(token, { type: 'bearer' });

  it('registers partner and stores a hash, never the bearer token', async () => {
    const partner = await registerPartner(app);
    expect(partner.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(partner.inviteCode).toMatch(/^\d{6}$/);
    const [user] =
      await sql`select token_hash, sharing_enabled from users where role = 'partner'`;
    expect(user).toEqual({
      token_hash: hashToken(partner.token),
      sharing_enabled: false,
    });
    const [invite] =
      await sql`select expires_at > now() + interval '6 days' as valid from invites`;
    expect(invite.valid).toBe(true);
  });

  it('re-register replaces the partner token', async () => {
    const old = await registerPartner(app);
    const current = await registerPartner(app, 'Tên mới');
    await invites(old.token).expect(401, { error: 'unauthorized' });
    await invites(current.token).expect(201);
    expect(await sql`select name from users where role = 'partner'`).toEqual([
      { name: 'Tên mới' },
    ]);
  });

  it.each(['wrong', 's3crex', '🔒'])(
    'rejects wrong admin secret %s',
    async (adminSecret) => {
      await request(app.getHttpServer())
        .post('/register')
        .send({ name: 'Tân', adminSecret })
        .expect(401, { error: 'unauthorized' });
      expect(await sql`select id from users`).toHaveLength(0);
    },
  );

  it('rejects registration when ADMIN_SECRET is unset or empty', async () => {
    delete process.env.ADMIN_SECRET;
    await request(app.getHttpServer())
      .post('/register')
      .send({ name: 'Tân', adminSecret: 's3cret' })
      .expect(401);
    process.env.ADMIN_SECRET = '';
    await request(app.getHttpServer())
      .post('/register')
      .send({ name: 'Tân', adminSecret: 's3cret' })
      .expect(401);
  });

  it('joins sleeper once and returns partnerName', async () => {
    const partner = await registerPartner(app);
    const response = await join(partner.inviteCode).expect(201);
    const body = response.body as { token: string; partnerName: string };
    expect(body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(body.partnerName).toBe('Tân');
    await join(partner.inviteCode).expect(400, { error: 'invalid code' });
    expect(
      await sql`select sharing_enabled from users where role = 'sleeper'`,
    ).toEqual([{ sharing_enabled: false }]);
  });

  it('rejects expired invites', async () => {
    const partner = await registerPartner(app);
    await sql`update invites set expires_at = now() - interval '1 minute'`;
    await join(partner.inviteCode).expect(400, { error: 'invalid code' });
  });

  it('allows the fifth attempt after four wrong codes', async () => {
    const partner = await registerPartner(app);
    const wrong = partner.inviteCode === '000000' ? '000001' : '000000';
    for (let i = 0; i < 4; i++) await join(wrong).expect(400);
    await join(partner.inviteCode).expect(201);
  });

  it('locks all live invites after five wrong codes', async () => {
    const partner = await registerPartner(app);
    const next = await invites(partner.token).expect(201);
    const code = (next.body as { inviteCode: string }).inviteCode;
    const wrong = ['000000', '000001', '000002'].find(
      (value) => value !== partner.inviteCode && value !== code,
    )!;
    for (let i = 0; i < 5; i++) await join(wrong).expect(400);
    await join(partner.inviteCode).expect(400, { error: 'invalid code' });
    await join(code).expect(400, { error: 'invalid code' });
  });

  it('concurrent joins use a code once', async () => {
    const partner = await registerPartner(app);
    const results = await Promise.all([
      join(partner.inviteCode),
      join(partner.inviteCode),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 400]);
  });

  it('parallel guesses cannot bypass the five-attempt limit', async () => {
    const partner = await registerPartner(app);
    const wrong = partner.inviteCode === '000000' ? '000001' : '000000';
    const results = await Promise.all(
      Array.from({ length: 8 }, () => join(wrong)),
    );
    expect(results.every((r) => r.status === 400)).toBe(true);
    await join(partner.inviteCode).expect(400);
    expect(await sql`select attempts from invites`).toEqual([{ attempts: 9 }]);
  });

  it('rejoin revokes token, preserves user, logs, and sharing', async () => {
    const partner = await registerPartner(app);
    const sleeper = await joinSleeper(app, partner.inviteCode);
    const [original] =
      (await sql`update users set sharing_enabled = true where role = 'sleeper' returning id`) as {
        id: string;
      }[];
    await sql`insert into sleep_logs (user_id, date, bed_time, wake_time, latency_min, awakenings, rating)
      values (${original.id}, '2026-10-25', '2026-10-24T16:00:00Z', '2026-10-24T23:00:00Z', 10, 0, 4)`;
    const next = await invites(partner.token).expect(201);
    const current = await joinSleeper(
      app,
      (next.body as { inviteCode: string }).inviteCode,
    );
    await invites(sleeper.token).expect(401);
    await invites(current.token).expect(403, { error: 'forbidden' });
    expect(
      await sql`select id, sharing_enabled from users where role = 'sleeper'`,
    ).toEqual([{ id: original.id, sharing_enabled: true }]);
    expect(await sql`select rating from sleep_logs`).toEqual([{ rating: 4 }]);
  });

  it('guards protected routes and rejects malformed Bearer headers', async () => {
    for (const header of [
      '',
      'Basic abc',
      'Bearer wrong',
      `Bearer ${'a'.repeat(43)} extra`,
      `Bearer ${'a'.repeat(43)}`,
    ]) {
      await request(app.getHttpServer())
        .post('/invites')
        .set('Authorization', header)
        .expect(401, { error: 'unauthorized' });
    }
    const partner = await registerPartner(app);
    const sleeper = await joinSleeper(app, partner.inviteCode);
    await invites(sleeper.token).expect(403);
  });

  it.each([
    { code: '123456', name: 'Em', role: 'partner' },
    { code: '123', name: 'Em' },
    { code: 123456, name: 'Em' },
    { code: '123456', name: '' },
    { code: '123456', name: 'x'.repeat(51) },
    { code: '123456', name: null },
  ])('validates untrusted join bodies %j', async (body) => {
    const response = await request(app.getHttpServer())
      .post('/join')
      .send(body)
      .expect(400);
    expect(typeof (response.body as { error: unknown }).error).toBe('string');
  });
});
