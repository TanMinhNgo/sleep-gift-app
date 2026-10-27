import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { joinSleeper, makeApp, registerPartner, resetDb } from './helpers';

const log = {
  bed_time: '2026-10-24T16:30:00.000Z',
  wake_time: '2026-10-24T23:30:00.000Z',
  latency_min: 40,
  awakenings: 2,
  awake_min: 15,
  rating: 3,
  note: 'hơi mệt',
  updated_at: '2026-10-25T00:00:00.000Z',
};

describe('Sleep logs (real Postgres)', () => {
  let app: INestApplication<Server>;
  let partner: string;
  let sleeper: string;
  beforeAll(async () => {
    app = await makeApp();
  });
  beforeEach(async () => {
    process.env.ADMIN_SECRET = 's3cret';
    await resetDb();
    const registered = await registerPartner(app);
    partner = registered.token;
    sleeper = (await joinSleeper(app, registered.inviteCode)).token;
  });
  afterAll(async () => {
    await app?.close();
  });
  const put = (body: object = log, date = '2026-10-25', token = sleeper) =>
    request(app.getHttpServer())
      .put(`/logs/${date}`)
      .auth(token, { type: 'bearer' })
      .send(body);
  const get = (token = sleeper, query = '?from=2026-10-01&to=2026-10-31') =>
    request(app.getHttpServer())
      .get(`/logs${query}`)
      .auth(token, { type: 'bearer' });

  it('upserts, sorts, filters and serializes only public log fields', async () => {
    await get().expect(200, []);
    await put().expect(200, { applied: true });
    await put(log, '2026-10-24').expect(200, { applied: true });
    await get().expect(200, [
      { ...log, date: '2026-10-24' },
      { ...log, date: '2026-10-25' },
    ]);
    await get(sleeper, '?from=2026-10-25&to=2026-10-25').expect(200, [
      { ...log, date: '2026-10-25' },
    ]);
  });

  it('ignores older/equal writes and applies newer ones', async () => {
    await put().expect(200, { applied: true });
    await put({
      ...log,
      rating: 5,
      updated_at: '2026-10-24T00:00:00.000Z',
    }).expect(200, { applied: false });
    await put({ ...log, rating: 5 }).expect(200, { applied: false });
    await get().expect(200, [{ ...log, date: '2026-10-25' }]);
    const newer = { ...log, rating: 4, updated_at: '2026-10-26T00:00:00.000Z' };
    await put(newer).expect(200, { applied: true });
    await get().expect(200, [{ ...newer, date: '2026-10-25' }]);
  });

  it('keeps the newest timestamp under concurrent writes', async () => {
    const newest = {
      ...log,
      rating: 5,
      updated_at: '2026-10-27T00:00:00.000Z',
    };
    await Promise.all([put(newest).expect(200), put(log).expect(200)]);
    await get().expect(200, [{ ...newest, date: '2026-10-25' }]);
  });

  it('returns 404 to partner before a sleeper joins', async () => {
    await resetDb();
    const onlyPartner = await registerPartner(app);
    await get(onlyPartner.token).expect(404, { error: 'no sleeper yet' });
  });

  it('enforces sharing for both populated and empty date ranges', async () => {
    await get(partner).expect(403, { error: 'sharing disabled' });
    await put().expect(200);
    await get(partner).expect(403, { error: 'sharing disabled' });
    await request(app.getHttpServer())
      .patch('/me')
      .auth(sleeper, { type: 'bearer' })
      .send({ sharing_enabled: true })
      .expect(200);
    await get(partner).expect(200, [{ ...log, date: '2026-10-25' }]);
    await get(partner, '?from=2026-11-01&to=2026-11-30').expect(200, []);
    await request(app.getHttpServer())
      .patch('/me')
      .auth(sleeper, { type: 'bearer' })
      .send({ sharing_enabled: false })
      .expect(200);
    await get(partner).expect(403, { error: 'sharing disabled' });
    await get().expect(200, [{ ...log, date: '2026-10-25' }]);
  });

  it('rejects partner writes and unauthenticated requests', async () => {
    await put(log, '2026-10-25', partner).expect(403, { error: 'forbidden' });
    await request(app.getHttpServer())
      .get('/logs?from=2026-10-01&to=2026-10-31')
      .expect(401);
    await request(app.getHttpServer())
      .put('/logs/2026-10-25')
      .send(log)
      .expect(401);
  });

  it('rejects malformed, absent, repeated or excessive date ranges', async () => {
    for (const date of ['abc', '2026-02-30'])
      await put(log, date).expect(400, { error: 'invalid date' });
    for (const query of [
      '',
      '?from=&to=',
      '?from=2026-02-30&to=2026-03-01',
      '?from=2026-11-01&to=2026-10-01',
      '?from=2026-01-01&to=2027-01-02',
      '?from=2026-10-01&from=2026-10-01&to=2026-10-31',
    ]) {
      await get(sleeper, query).expect(400, { error: 'invalid date' });
    }
    await get(sleeper, '?from=2026-01-01&to=2027-01-01').expect(200, []);
  });

  it('rejects impossible values and unknown fields', async () => {
    for (const overrides of [
      { wake_time: log.bed_time },
      { rating: 0 },
      { rating: 6 },
      { latency_min: -5 },
      { awakenings: 31 },
      { awake_min: 601 },
      { latency_min: 1.5 },
      { rating: '3' },
      { bed_time: '2026-02-30T12:00:00Z' },
      { updated_at: 'abc' },
      { note: 'x'.repeat(501) },
      { user_id: 'fake' },
      { awake_min: null },
    ]) {
      const response = await put({ ...log, ...overrides }).expect(400);
      expect(typeof (response.body as { error: unknown }).error).toBe('string');
    }
    await get().expect(200, []);
  });

  it('allows omitted note and normalizes timezone offsets', async () => {
    await put({
      ...log,
      note: undefined,
      bed_time: '2026-10-24T23:30:00+07:00',
    }).expect(200);
    await get().expect(200, [{ ...log, note: null, date: '2026-10-25' }]);
  });
});
