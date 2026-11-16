import express from 'express';
import type { Express, RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { UNAUTHORIZED } from '../../../../../shared/http/status.ts';
import { loginRateLimit } from '../loginRateLimit.ts';

const appBehind = (limit: RequestHandler): Express => {
  const app = express();
  app.use(limit);

  app.get('/fail', (_req, res) => {
    res.status(UNAUTHORIZED).end();
  });

  app.get('/ok', (_req, res) => {
    res.end();
  });

  return app;
};

describe('loginRateLimit', () => {
  it('should answer 429 when the allowed failures are used up', async () => {
    // Given
    const app = appBehind(loginRateLimit({ windowMs: 60_000, maxFailedAttempts: 2 }));
    await request(app).get('/fail');
    await request(app).get('/fail');

    // When
    const response = await request(app).get('/fail');

    // Then
    expect(response.status).toBe(429);
    expect(response.body).toEqual({ error: 'Too many failed attempts, try again later' });
  });

  it('should not count successful requests when they come before a failure', async () => {
    // Given
    const app = appBehind(loginRateLimit({ windowMs: 60_000, maxFailedAttempts: 2 }));
    await request(app).get('/ok');
    await request(app).get('/ok');
    await request(app).get('/ok');

    // When
    const response = await request(app).get('/fail');

    // Then
    expect(response.status).toBe(401);
  });

  it('should allow 10 failures when no limit is given', async () => {
    // Given
    const app = appBehind(loginRateLimit());
    const statuses: number[] = [];

    // When
    for (let attempt = 0; attempt < 11; attempt++) {
      statuses.push((await request(app).get('/fail')).status);
    }

    // Then
    expect(statuses).toEqual([...Array<number>(10).fill(401), 429]);
  });
});
