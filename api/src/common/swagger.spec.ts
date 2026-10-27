import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type {
  OpenAPIObject,
  OperationObject,
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../app.module';
import { configure } from '../main';
import { sql } from './db';

jest.mock('./db', () => ({ sql: jest.fn() }));

describe('Swagger HTTP contract', () => {
  let app: INestApplication<Server>;
  let document: OpenAPIObject;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>();
    configure(app);
    await app.init();
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    document = response.body as OpenAPIObject;
  }, 30_000);
  afterAll(async () => {
    await app?.close();
  });

  it('serves Swagger UI and assets without querying the database', async () => {
    await request(app.getHttpServer())
      .get('/docs')
      .expect(200)
      .expect(/Swagger UI/);
    await request(app.getHttpServer())
      .get('/docs/swagger-ui-init.js')
      .expect(200)
      .expect(/SwaggerUIBundle/);
    await request(app.getHttpServer())
      .get('/docs/swagger-ui-bundle.js')
      .expect(200);
    await request(app.getHttpServer())
      .get('/docs-yaml')
      .expect(200)
      .expect(/openapi:/);
    expect(sql).not.toHaveBeenCalled();
  });

  it('documents all ten operations, marks only register/join public, and defines opaque Bearer auth', () => {
    const expected = [
      ['post', '/register'],
      ['post', '/join'],
      ['post', '/invites'],
      ['get', '/me'],
      ['patch', '/me'],
      ['put', '/logs/{date}'],
      ['get', '/logs'],
      ['post', '/notes'],
      ['get', '/notes'],
      ['delete', '/notes/{id}'],
    ] as const;
    const operations: OperationObject[] = [];
    for (const [method, path] of expected) {
      const operation = document.paths[path]?.[method] as OperationObject;
      expect(operation?.summary).toBeTruthy();
      expect(operation.responses).toBeDefined();
      if (path === '/register' || path === '/join')
        expect(operation.security ?? []).toEqual([]);
      else expect(operation.security).toEqual([{ bearer: [] }]);
      operations.push(operation);
    }
    expect(
      Object.values(document.paths).reduce(
        (count, path) =>
          count +
          Object.keys(path ?? {}).filter((key) =>
            ['get', 'post', 'put', 'patch', 'delete'].includes(key),
          ).length,
        0,
      ),
    ).toBe(expected.length);
    expect(document.components?.securitySchemes?.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
    expect(
      new Set(operations.map((operation) => operation.operationId)).size,
    ).toBe(expected.length);
  });

  it('publishes request constraints, response shapes, nullability and bodyless deletion', () => {
    const schemas = document.components?.schemas as Record<
      string,
      SchemaObject
    >;
    expect(schemas.RegisterDto.required).toEqual(['name', 'adminSecret']);
    expect(schemas.RegisterDto.properties?.adminSecret).toMatchObject({
      writeOnly: true,
      format: 'password',
    });
    expect(schemas.JoinDto.properties?.code).toMatchObject({
      type: 'string',
      pattern: '^\\d{6}$',
    });
    expect(schemas.LogDto.properties?.rating).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: 5,
    });
    expect(schemas.LogDto.required).not.toContain('note');
    expect(schemas.LogResponseDto.required).toContain('note');
    expect(schemas.LogResponseDto.properties?.note).toMatchObject({
      nullable: true,
    });
    expect(schemas.NoteResponseDto.properties?.show_on_date).toMatchObject({
      nullable: true,
      format: 'date',
    });
    expect(schemas.MeResponseDto.properties?.other).toMatchObject({
      nullable: true,
    });
    expect(schemas.UpdateMeDto.required ?? []).toEqual([]);
    expect(Object.keys(schemas.ErrorResponseDto.properties ?? {})).toEqual([
      'error',
    ]);
    expect(schemas.ErrorResponseDto.properties?.error).toMatchObject({
      type: 'string',
    });
    expect(
      document.paths['/notes/{id}']?.delete?.responses['204'],
    ).not.toHaveProperty('content');
    expect(document.paths['/logs']?.get?.responses['403']).toBeDefined();
    expect(document.paths['/logs']?.get?.responses['404']).toBeDefined();
    for (const path of ['/logs', '/notes']) {
      const parameters = document.paths[path]?.get?.parameters as Exclude<
        OperationObject['parameters'],
        undefined
      >;
      for (const name of ['from', 'to'])
        expect(parameters).toContainEqual(
          expect.objectContaining({ name, in: 'query', required: true }),
        );
    }
    const requestBody = document.paths['/logs/{date}']?.put?.requestBody as {
      content: Record<string, { schema: ReferenceObject }>;
    };
    expect(requestBody.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/LogDto',
    );
  });

  it('keeps protected endpoints guarded when docs are enabled', async () => {
    await request(app.getHttpServer())
      .get('/me')
      .expect(401, { error: 'unauthorized' });
    expect(sql).not.toHaveBeenCalled();
  });
});
