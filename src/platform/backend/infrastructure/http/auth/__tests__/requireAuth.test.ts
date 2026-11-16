import cookieParser from 'cookie-parser';
import express from 'express';
import type { Express } from 'express';
import request from 'supertest';
import type { Response } from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { sessionService } from '../../../../domain/auth/index.ts';
import type { SessionService } from '../../../../domain/auth/index.ts';
import { createTestDatabase, createTestUser } from '../../../__tests__/helpers.ts';
import { currentUser } from '../currentUser.ts';
import { requireAuth } from '../requireAuth.ts';
import { sessionCookies } from '../sessionCookie.ts';

const HOUR = 60 * 60 * 1000;

const setCookieOf = (response: Response): string[] =>
  (response.headers['set-cookie'] as string[] | undefined) ?? [];

describe('requireAuth', () => {
  let clock: { now: number };
  let sessions: SessionService;
  let app: Express;
  let userId: number;

  beforeEach(async () => {
    const db = createTestDatabase();
    clock = { now: Date.UTC(2026, 0, 1) };
    sessions = sessionService(db, { ttlDays: 30, now: () => clock.now });
    await createTestUser(db, 'ash');
    userId = (db.prepare('SELECT id FROM users').get() as { id: number }).id;

    app = express();
    app.use(cookieParser());

    app.use(
      requireAuth(
        sessions,
        sessionCookies(false, () => clock.now),
      ),
    );

    app.get('/me', (req, res) => {
      res.json(currentUser(req));
    });
  });

  const signIn = (): string => sessions.create(userId, undefined).token;

  it('should answer 401 when there is no cookie', async () => {
    // When
    const response = await request(app).get('/me');

    // Then
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Not authenticated' });
  });

  it('should answer 401 when the token is unknown', async () => {
    // When
    const response = await request(app).get('/me').set('Cookie', 'hd_session=unknown');

    // Then
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Not authenticated' });
  });

  it('should let the request through and set the current user when the session is valid', async () => {
    // Given
    const token = signIn();

    // When
    const response = await request(app).get('/me').set('Cookie', `hd_session=${token}`);

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: userId, username: 'ash' });
  });

  it('should send no cookie when the session was used less than an hour ago', async () => {
    // Given
    const token = signIn();
    clock.now += HOUR - 1;

    // When
    const response = await request(app).get('/me').set('Cookie', `hd_session=${token}`);

    // Then
    expect(setCookieOf(response)).toEqual([]);
  });

  it('should renew the cookie when the session was last used an hour or more ago', async () => {
    // Given
    const token = signIn();
    clock.now += HOUR;

    // When
    const response = await request(app).get('/me').set('Cookie', `hd_session=${token}`);

    // Then
    const [cookie] = setCookieOf(response);
    expect(cookie).toContain(`hd_session=${token}`);
    expect(cookie).toContain(`Max-Age=${String(30 * 24 * 60 * 60)}`);
  });
});
