import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { addDays, vnToday } from '../src/common/dates';
import { joinSleeper, makeApp, registerPartner, resetDb } from './helpers';

type Note = {
  id: string;
  kind: string;
  text: string;
  show_on_date: string | null;
  created_at: string;
};

describe('Notes (real Postgres)', () => {
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
  afterEach(() => jest.useRealTimers());
  afterAll(async () => {
    await app?.close();
  });
  const post = (body: object, token = partner) =>
    request(app.getHttpServer())
      .post('/notes')
      .auth(token, { type: 'bearer' })
      .send(body);
  const get = (token = sleeper, from = vnToday(), to = addDays(from, 30)) =>
    request(app.getHttpServer())
      .get('/notes')
      .query({ from, to })
      .auth(token, { type: 'bearer' });
  const remove = (id: string, token = partner) =>
    request(app.getHttpServer())
      .delete(`/notes/${id}`)
      .auth(token, { type: 'bearer' });

  it('creates all note kinds and serializes the contract', async () => {
    for (const body of [
      { kind: 'goodnight', text: 'Ngủ ngon', show_on_date: vnToday() },
      { kind: 'scene', text: 'x'.repeat(1500) },
      { kind: 'word', text: 'BÀN' },
    ]) {
      const response = await post(body).expect(201);
      const note = response.body as Note;
      expect(note.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(note.created_at).toBe(new Date(note.created_at).toISOString());
      expect(note.kind).toBe(body.kind);
      expect(note.text).toBe(body.text);
      expect(note.show_on_date).toBe(body.show_on_date ?? null);
      expect(Object.keys(note).sort()).toEqual([
        'created_at',
        'id',
        'kind',
        'show_on_date',
        'text',
      ]);
    }
  });

  it('sleeper sees the seven-day window plus all scenes/words; partner sees the full range', async () => {
    const today = vnToday();
    for (const offset of [-1, 0, 7, 8, 31])
      await post({
        kind: 'goodnight',
        text: `day ${offset}`,
        show_on_date: addDays(today, offset),
      }).expect(201);
    await post({
      kind: 'scene',
      text: 'Dạo bước',
      show_on_date: addDays(today, 100),
    }).expect(201);
    await post({ kind: 'word', text: 'BÀN' }).expect(201);
    const visible = await get().expect(200);
    expect((visible.body as Note[]).map((n) => n.text).sort()).toEqual(
      ['BÀN', 'Dạo bước', 'day 0', 'day 7'].sort(),
    );
    const all = await get(partner).expect(200);
    expect((all.body as Note[]).map((n) => n.text).sort()).toEqual(
      ['BÀN', 'Dạo bước', 'day 0', 'day 7', 'day 8'].sort(),
    );
    const future = await get(
      sleeper,
      addDays(today, 8),
      addDays(today, 9),
    ).expect(200);
    expect((future.body as Note[]).map((n) => n.kind).sort()).toEqual([
      'scene',
      'word',
    ]);
  });

  it('uses Vietnam date at 01:30 local time without faking network timers', async () => {
    jest.useFakeTimers({
      now: new Date('2026-10-24T18:30:00Z'),
      doNotFake: [
        'hrtime',
        'performance',
        'queueMicrotask',
        'nextTick',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
    });
    for (const date of ['2026-11-01', '2026-11-02'])
      await post({ kind: 'goodnight', text: date, show_on_date: date }).expect(
        201,
      );
    const response = await get(sleeper, '2026-10-25', '2026-11-10').expect(200);
    expect((response.body as Note[]).map((n) => n.show_on_date)).toEqual([
      '2026-11-01',
    ]);
  });

  it('rejects sleeper writes and deletes', async () => {
    const response = await post({ kind: 'word', text: 'BÀN' }).expect(201);
    await post({ kind: 'word', text: 'BÀN' }, sleeper).expect(403, {
      error: 'forbidden',
    });
    await remove((response.body as Note).id, sleeper).expect(403, {
      error: 'forbidden',
    });
  });

  it('deletes once, rejects bad IDs, and removes deleted notes from sync', async () => {
    const response = await post({ kind: 'word', text: 'BÀN' }).expect(201);
    const id = (response.body as Note).id;
    const deleted = await remove(id).expect(204);
    expect(deleted.text).toBe('');
    await get().expect(200, []);
    await remove(id).expect(404, { error: 'not found' });
    await remove(randomUUID()).expect(404);
    await remove('abc').expect(400);
  });

  it('rejects invalid dates, kinds, text and extra fields', async () => {
    for (const body of [
      { kind: 'goodnight', text: 'Ngủ ngon' },
      { kind: 'goodnight', text: 'Ngủ ngon', show_on_date: null },
      { kind: 'goodnight', text: 'Ngủ ngon', show_on_date: '2026-02-30' },
      { kind: 'scene', text: 'Dạo bước', show_on_date: '2026-10-25T00:00:00Z' },
      { kind: 'word', text: 'BÀN', show_on_date: 123 },
      { kind: 'wrong', text: 'BÀN' },
      { kind: 'word', text: '' },
      { kind: 'scene', text: 'x'.repeat(2001) },
      { kind: 'word', text: 'BÀN', owner: 'me' },
    ]) {
      const response = await post(body).expect(400);
      expect(typeof (response.body as { error: unknown }).error).toBe('string');
    }
    await get().expect(200, []);
  });

  it('validates date ranges and requires authentication', async () => {
    for (const query of [
      '',
      '?from=&to=',
      '?from=2026-02-30&to=2026-03-01',
      '?from=2026-11-01&to=2026-10-01',
      '?from=2026-01-01&to=2027-01-02',
    ]) {
      await request(app.getHttpServer())
        .get(`/notes${query}`)
        .auth(sleeper, { type: 'bearer' })
        .expect(400, { error: 'invalid date' });
    }
    await request(app.getHttpServer()).get('/notes').expect(401);
    await request(app.getHttpServer())
      .post('/notes')
      .send({ kind: 'word', text: 'BÀN' })
      .expect(401);
    await request(app.getHttpServer())
      .delete(`/notes/${randomUUID()}`)
      .expect(401);
  });
});
