import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { joinSleeper, makeApp, registerPartner, resetDb } from './helpers';

describe('Profile and sharing', () => {
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
  const get = (token: string) =>
    request(app.getHttpServer()).get('/me').auth(token, { type: 'bearer' });
  const patch = (token: string, body: object) =>
    request(app.getHttpServer())
      .patch('/me')
      .auth(token, { type: 'bearer' })
      .send(body);

  it('partner sees other null before join', async () => {
    const partner = await registerPartner(app);
    await get(partner.token).expect(200, {
      role: 'partner',
      name: 'Tân',
      sharing_enabled: false,
      other: null,
    });
  });

  it('sleeper sees partner and can toggle sharing both ways', async () => {
    const partner = await registerPartner(app);
    const sleeper = await joinSleeper(app, partner.inviteCode);
    await get(sleeper.token).expect(200, {
      role: 'sleeper',
      name: 'Em',
      sharing_enabled: false,
      other: { name: 'Tân', sharing_enabled: false },
    });
    for (const enabled of [true, false]) {
      const changed = await patch(sleeper.token, {
        sharing_enabled: enabled,
      }).expect(200);
      expect(
        (changed.body as { sharing_enabled: boolean }).sharing_enabled,
      ).toBe(enabled);
      const response = await get(partner.token).expect(200);
      expect(
        (response.body as { other: { sharing_enabled: boolean } }).other
          .sharing_enabled,
      ).toBe(enabled);
    }
  });

  it('partner cannot change sharing, even to false', async () => {
    const partner = await registerPartner(app);
    await patch(partner.token, { sharing_enabled: true }).expect(403, {
      error: 'forbidden',
    });
    await patch(partner.token, { sharing_enabled: false }).expect(403);
  });

  it('renames only self and accepts empty patch', async () => {
    const partner = await registerPartner(app);
    const sleeper = await joinSleeper(app, partner.inviteCode);
    const renamed = await patch(sleeper.token, { name: 'Bé' }).expect(200);
    expect((renamed.body as { name: string }).name).toBe('Bé');
    const response = await get(partner.token).expect(200);
    expect((response.body as { name: string }).name).toBe('Tân');
    await patch(sleeper.token, {}).expect(200);
  });

  it.each([
    { name: '' },
    { name: null },
    { sharing_enabled: null },
    { sharing_enabled: 'false' },
    { role: 'partner' },
  ])('rejects invalid updates %j', async (body) => {
    const partner = await registerPartner(app);
    await patch(partner.token, body).expect(400);
  });

  it('requires authentication for both profile routes', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);
    await request(app.getHttpServer())
      .patch('/me')
      .send({ name: 'Bé' })
      .expect(401);
  });
});
