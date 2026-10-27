import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { Pool } from '@neondatabase/serverless';
import request from 'supertest';
import type { Server } from 'node:http';
import { AppModule } from '../src/app.module';
import { configure } from '../src/main';
import { migrate } from '../scripts/migrate';

export async function resetDb(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url || process.env.TEST_DATABASE_URL !== url)
    throw new Error('Refusing reset outside dedicated test database');
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query('drop schema public cascade; create schema public;');
  } finally {
    await pool.end();
  }
  await migrate(url);
}

export async function makeApp(): Promise<INestApplication<Server>> {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = module.createNestApplication<INestApplication<Server>>();
  configure(app);
  await app.init();
  return app;
}

export async function registerPartner(
  app: INestApplication<Server>,
  name = 'Tân',
): Promise<{ token: string; inviteCode: string }> {
  const response = await request(app.getHttpServer())
    .post('/register')
    .send({ name, adminSecret: process.env.ADMIN_SECRET })
    .expect(201);
  return response.body as { token: string; inviteCode: string };
}

export async function joinSleeper(
  app: INestApplication<Server>,
  code: string,
  name = 'Em',
): Promise<{ token: string }> {
  const response = await request(app.getHttpServer())
    .post('/join')
    .send({ code, name })
    .expect(201);
  return response.body as { token: string };
}
