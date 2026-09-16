import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { HttpExceptionFilter } from './../src/common/http-exception.filter';
import { AppModule } from './../src/app.module';

/**
 * These hit the real database, so they clean up after themselves.
 * The app is configured exactly as main.ts configures it; otherwise the
 * tests would pass while production behaved differently.
 */
describe('Jobs API (e2e)', () => {
  let app: INestApplication<App>;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await request(app.getHttpServer()).delete(`/jobs/${id}`);
    }
    await app.close();
  });

  async function createJob(title = 'e2e job') {
    const response = await request(app.getHttpServer())
      .post('/jobs')
      .send({ title, type: 'test' })
      .expect(201);

    const job = response.body as { id: string; status: string; version: number };
    createdIds.push(job.id);
    return job;
  }

  it('reports health', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect((response.body as { status: string }).status).toBe('ok');
  });

  it('creates a job as pending', async () => {
    const job = await createJob('creates as pending');

    expect(job.status).toBe('pending');
    expect(job.version).toBe(1);
  });

  it('rejects a blank title', async () => {
    const response = await request(app.getHttpServer())
      .post('/jobs')
      .send({ title: '   ', type: 'test' })
      .expect(400);

    expect(JSON.stringify(response.body)).toContain('title should not be empty');
  });

  it('refuses to let the client choose the starting status', async () => {
    const response = await request(app.getHttpServer())
      .post('/jobs')
      .send({ title: 'sneaky', type: 'test', status: 'completed' })
      .expect(400);

    expect(JSON.stringify(response.body)).toContain(
      'property status should not exist',
    );
  });

  it('rejects an unknown status filter', async () => {
    await request(app.getHttpServer()).get('/jobs?status=banana').expect(400);
  });

  it('runs a job and refuses to start it twice', async () => {
    const job = await createJob('start once');

    await request(app.getHttpServer())
      .patch(`/jobs/${job.id}/status`)
      .send({ status: 'running' })
      .expect(200);

    // The second caller lost the race: the row no longer matches the WHERE clause.
    await request(app.getHttpServer())
      .patch(`/jobs/${job.id}/status`)
      .send({ status: 'running' })
      .expect(409);
  });

  it('refuses to skip running', async () => {
    const job = await createJob('no skipping');

    await request(app.getHttpServer())
      .patch(`/jobs/${job.id}/status`)
      .send({ status: 'completed' })
      .expect(409);
  });

  it('refuses a stale If-Match', async () => {
    const job = await createJob('stale version');

    await request(app.getHttpServer())
      .patch(`/jobs/${job.id}/status`)
      .set('If-Match', '1')
      .send({ status: 'running' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/jobs/${job.id}/status`)
      .set('If-Match', '1')
      .send({ status: 'completed' })
      .expect(412);
  });

  it('404s for a valid but unknown id, and 400s for a malformed one', async () => {
    await request(app.getHttpServer())
      .patch('/jobs/00000000-0000-4000-8000-000000000000/status')
      .send({ status: 'running' })
      .expect(404);

    await request(app.getHttpServer())
      .patch('/jobs/not-a-uuid/status')
      .send({ status: 'running' })
      .expect(400);
  });

  it('deletes a job once', async () => {
    const job = await createJob('delete me');

    await request(app.getHttpServer()).delete(`/jobs/${job.id}`).expect(204);
    await request(app.getHttpServer()).delete(`/jobs/${job.id}`).expect(404);
  });

  it('counts every status', async () => {
    const response = await request(app.getHttpServer())
      .get('/jobs/stats')
      .expect(200);

    expect(Object.keys(response.body as object).sort()).toEqual([
      'completed',
      'failed',
      'pending',
      'running',
    ]);
  });
});
