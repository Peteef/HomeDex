import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { NO_CONTENT } from '../../../../shared/http/status.ts';
import { requestGuard } from '../requestGuard.ts';

const HOST = 'homedex.test';
const SAME_ORIGIN = 'http://homedex.test';

const app = express();
app.use(requestGuard);

app.all('/x', (_req, res) => {
  res.status(NO_CONTENT).end();
});

const postJsonFrom = (origin: string): request.Test =>
  request(app)
    .post('/x')
    .set('Host', HOST)
    .set('Origin', origin)
    .set('Content-Type', 'application/json')
    .send('{}');

describe('requestGuard', () => {
  it('should let a GET through when it has no headers', async () => {
    // When
    const response = await request(app).get('/x');

    // Then
    expect(response.status).toBe(204);
  });

  it('should answer 403 when a POST comes from another origin', async () => {
    // When
    const response = await postJsonFrom('http://evil.example.com');

    // Then
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Foreign origin' });
  });

  it('should answer 403 when the origin differs only by port', async () => {
    // When
    const response = await postJsonFrom('http://homedex.test:8080');

    // Then
    expect(response.status).toBe(403);
  });

  it('should answer 403 when the origin is not a URL', async () => {
    // When
    const response = await postJsonFrom('null');

    // Then
    expect(response.status).toBe(403);
  });

  it('should answer 415 when a same-origin POST is not JSON', async () => {
    // When
    const response = await request(app)
      .post('/x')
      .set('Host', HOST)
      .set('Origin', SAME_ORIGIN)
      .set('Content-Type', 'text/plain')
      .send('hello');

    // Then
    expect(response.status).toBe(415);
    expect(response.body).toEqual({ error: 'Content-Type must be application/json' });
  });

  it('should let a JSON POST through when it has no origin', async () => {
    // When
    const response = await request(app)
      .post('/x')
      .set('Content-Type', 'application/json')
      .send('{}');

    // Then
    expect(response.status).toBe(204);
  });

  it('should accept JSON when the content type has a charset', async () => {
    // When
    const response = await request(app)
      .post('/x')
      .set('Host', HOST)
      .set('Origin', SAME_ORIGIN)
      .set('Content-Type', 'application/json; charset=utf-8')
      .send('{}');

    // Then
    expect(response.status).toBe(204);
  });

  it.each(['put', 'patch', 'delete'] as const)(
    'should answer 403 when a %s comes from another origin',
    async (method) => {
      // When
      const response = await request(app)
        [method]('/x')
        .set('Host', HOST)
        .set('Origin', 'http://evil.example.com')
        .set('Content-Type', 'application/json');

      // Then
      expect(response.status).toBe(403);
    },
  );

  it.each(['put', 'patch', 'delete'] as const)(
    'should answer 415 when a same-origin %s is not JSON',
    async (method) => {
      // When
      const response = await request(app)
        [method]('/x')
        .set('Host', HOST)
        .set('Origin', SAME_ORIGIN)
        .set('Content-Type', 'text/plain');

      // Then
      expect(response.status).toBe(415);
    },
  );

  it.each(['put', 'patch', 'delete'] as const)(
    'should let a same-origin JSON %s through',
    async (method) => {
      // When
      const response = await request(app)
        [method]('/x')
        .set('Host', HOST)
        .set('Origin', SAME_ORIGIN)
        .set('Content-Type', 'application/json');

      // Then
      expect(response.status).toBe(204);
    },
  );
});
