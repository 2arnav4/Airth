import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';

/**
 * These hit the real database, so they clean up after themselves.
 * configureApp() is the same function main.ts calls, so the pipes, the
 * exception filter, the ETag policy and CORS are identical here and in
 * production. A test cannot pass against a differently-wired app.
 */
describe('Jobs API (e2e)', () => {
  let app: INestApplication<App>;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
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

  /**
   * Hostile input. The point is not that these are rejected — a job title is
   * free text and `DROP TABLE` is a legal title — but that they are stored and
   * returned as inert data, and that the table is still there afterwards.
   */
  describe('hostile input', () => {
    const SQL_PAYLOAD = "Robert'); DROP TABLE jobs;--";
    const XSS_PAYLOAD = '<script>alert("xss")</script>';

    it('stores SQL as text and leaves the table intact', async () => {
      const response = await request(app.getHttpServer())
        .post('/jobs')
        .send({ title: SQL_PAYLOAD, type: "'; DELETE FROM jobs WHERE '1'='1" })
        .expect(201);

      const job = response.body as { id: string; title: string; type: string };
      createdIds.push(job.id);

      expect(job.title).toBe(SQL_PAYLOAD);

      // If the payload had executed, this table would not answer.
      const after = await request(app.getHttpServer())
        .get('/jobs/stats')
        .expect(200);

      expect((after.body as { pending: number }).pending).toBeGreaterThan(0);
    });

    it('stores script tags as text, not markup', async () => {
      const response = await request(app.getHttpServer())
        .post('/jobs')
        .send({ title: XSS_PAYLOAD, type: 'test' })
        .expect(201);

      const job = response.body as { id: string; title: string };
      createdIds.push(job.id);

      expect(job.title).toBe(XSS_PAYLOAD);
    });

    it('rejects injection in the status filter', async () => {
      await request(app.getHttpServer())
        .get("/jobs?status=pending' OR '1'='1")
        .expect(400);

      await request(app.getHttpServer())
        .get('/jobs?status=pending;DROP TABLE jobs')
        .expect(400);
    });

    it('rejects injection in the id parameter', async () => {
      await request(app.getHttpServer())
        .patch("/jobs/1' OR '1'='1/status")
        .send({ status: 'running' })
        .expect(400);

      await request(app.getHttpServer())
        .delete("/jobs/1;DROP TABLE jobs")
        .expect(400);
    });

    it('rejects injection in the status body', async () => {
      const job = await createJob('status injection');

      await request(app.getHttpServer())
        .patch(`/jobs/${job.id}/status`)
        .send({ status: "running'; DROP TABLE jobs;--" })
        .expect(400);
    });

    it('rejects a non-numeric priority and an over-long title', async () => {
      await request(app.getHttpServer())
        .post('/jobs')
        .send({ title: 'bad priority', type: 'test', priority: "0; DROP TABLE jobs" })
        .expect(400);

      await request(app.getHttpServer())
        .post('/jobs')
        .send({ title: 'a'.repeat(201), type: 'test' })
        .expect(400);
    });

    it('rejects injection in the If-Match header', async () => {
      const job = await createJob('if-match injection');

      await request(app.getHttpServer())
        .patch(`/jobs/${job.id}/status`)
        .set('If-Match', "1 OR 1=1")
        .send({ status: 'running' })
        .expect(400);
    });
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
