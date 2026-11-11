import request from 'supertest';
import type { Response } from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTestApp,
  createTestUser,
  postJson,
  TEST_PASSWORD,
  testServices,
} from '../../infrastructure/__tests__/helpers.ts';
import type { TestApp } from '../../infrastructure/__tests__/helpers.ts';

const DAY = 24 * 60 * 60 * 1000;

const cookieHeader = (response: Response): string => {
  const header = response.headers['set-cookie'] as string[] | undefined;
  const cookie = header?.find((value) => value.startsWith('hd_session='));

  if (!cookie) {
    throw new Error('No session cookie was set');
  }

  return cookie.split(';')[0] ?? '';
};

const setCookieOf = (response: Response): string =>
  (response.headers['set-cookie'] as string[] | undefined)?.join('\n') ?? '';

describe('auth API', () => {
  let ctx: TestApp;

  const login = (username = 'ash', password = TEST_PASSWORD): request.Test =>
    postJson(ctx.app, '/api/auth/login', { username, password });

  const loggedInCookie = async (): Promise<string> => cookieHeader(await login());

  beforeEach(async () => {
    ctx = createTestApp();
    await createTestUser(ctx.db, 'Ash');
  });

  describe('login', () => {
    it('should return the user and set a hardened session cookie when the credentials are right', async () => {
      // When
      const response = await login('ash');

      // Then
      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        user: { id: expect.any(Number) as number, username: 'Ash' },
      });

      const cookie = setCookieOf(response);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/');
      expect(cookie).not.toContain('Secure');
      expect(cookie).toContain(`Max-Age=${String(365 * 86400)}`);
    });

    it('should mark the cookie Secure when HTTPS is on', async () => {
      // Given
      ctx = createTestApp({ COOKIE_SECURE: 'true' });
      await createTestUser(ctx.db, 'ash');

      // When
      const response = await login();

      // Then
      expect(setCookieOf(response)).toContain('Secure');
    });

    it('should not expose the password hash or the raw token in the response body', async () => {
      // When
      const response = await login();

      // Then
      expect(JSON.stringify(response.body)).not.toMatch(/scrypt|password|token/i);
    });

    it('should answer 401 with the same message when the password or the username is wrong', async () => {
      // When
      const wrongPassword = await login('ash', 'wrong-password');
      const wrongUser = await login('nobody', TEST_PASSWORD);

      // Then
      expect(wrongPassword.status).toBe(401);
      expect(wrongUser.status).toBe(401);
      expect(wrongPassword.body).toEqual(wrongUser.body);
      expect(wrongPassword.headers['set-cookie']).toBeUndefined();
    });

    it('should answer 400 when the body is missing fields', async () => {
      // When
      const response = await postJson(ctx.app, '/api/auth/login', { username: 'ash' });

      // Then
      expect(response.status).toBe(400);
    });

    it('should answer 400 with JSON when the body is malformed', async () => {
      // When
      const response = await request(ctx.app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{not json');

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid request body' });
    });

    it('should reject the login when the account is archived', async () => {
      // Given
      testServices(ctx.db).accounts.archive('ash');

      // When
      const response = await login();

      // Then
      expect(response.status).toBe(401);
    });

    it('should answer 429 when too many attempts failed', async () => {
      // Given
      const limited = createTestApp({}, { loginLimit: { windowMs: 60_000, maxFailedAttempts: 2 } });
      await createTestUser(limited.db, 'ash');
      ctx = limited;

      for (let attempt = 0; attempt < 2; attempt++) {
        expect((await login('ash', 'wrong-password')).status).toBe(401);
      }

      // When / Then
      expect((await login('ash', 'wrong-password')).status).toBe(429);
      expect((await login()).status).toBe(429);
    });

    it('should not count successful logins towards the limit', async () => {
      // When / Then
      for (let attempt = 0; attempt < 12; attempt++) {
        expect((await login()).status).toBe(200);
      }
    });
  });

  describe('me', () => {
    it('should return the current user when the session cookie is valid', async () => {
      // Given
      const cookie = await loggedInCookie();

      // When
      const response = await request(ctx.app).get('/api/auth/me').set('Cookie', cookie);

      // Then
      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        user: { id: expect.any(Number) as number, username: 'Ash' },
      });
    });

    it('should answer 401 when there is no cookie', async () => {
      // When
      const response = await request(ctx.app).get('/api/auth/me');

      // Then
      expect(response.status).toBe(401);
    });

    it('should answer 401 when the cookie holds an unknown token', async () => {
      // When
      const response = await request(ctx.app).get('/api/auth/me').set('Cookie', 'hd_session=bogus');

      // Then
      expect(response.status).toBe(401);
    });

    it('should answer 401 when the session has expired', async () => {
      // Given
      const cookie = await loggedInCookie();
      ctx.clock.now += 366 * DAY;

      // When
      const response = await request(ctx.app).get('/api/auth/me').set('Cookie', cookie);

      // Then
      expect(response.status).toBe(401);
    });

    it('should renew the cookie when the session slides', async () => {
      // Given
      const cookie = await loggedInCookie();
      ctx.clock.now += 2 * 60 * 60 * 1000;

      // When
      const response = await request(ctx.app).get('/api/auth/me').set('Cookie', cookie);

      // Then
      expect(response.status).toBe(200);
      expect(setCookieOf(response)).toContain('hd_session=');
    });

    it('should keep the session alive across a year when it is used every month', async () => {
      // Given
      const cookie = await loggedInCookie();

      // When / Then
      for (let month = 0; month < 14; month++) {
        ctx.clock.now += 30 * DAY;
        const response = await request(ctx.app).get('/api/auth/me').set('Cookie', cookie);
        expect(response.status).toBe(200);
      }
    });

    it('should answer 401 when the account was archived after login', async () => {
      // Given
      const cookie = await loggedInCookie();
      testServices(ctx.db).accounts.archive('ash');

      // When
      const response = await request(ctx.app).get('/api/auth/me').set('Cookie', cookie);

      // Then
      expect(response.status).toBe(401);
    });
  });

  describe('logout', () => {
    it('should end the session and clear the cookie', async () => {
      // Given
      const cookie = await loggedInCookie();

      // When
      const response = await postJson(ctx.app, '/api/auth/logout').set('Cookie', cookie);

      // Then
      expect(response.status).toBe(204);
      expect(setCookieOf(response)).toMatch(/hd_session=;/);
      const me = await request(ctx.app).get('/api/auth/me').set('Cookie', cookie);
      expect(me.status).toBe(401);
    });

    it('should leave other devices signed in when one device logs out', async () => {
      // Given
      const phone = await loggedInCookie();
      const laptop = await loggedInCookie();

      // When
      await postJson(ctx.app, '/api/auth/logout').set('Cookie', phone);

      // Then
      const response = await request(ctx.app).get('/api/auth/me').set('Cookie', laptop);
      expect(response.status).toBe(200);
    });

    it('should answer 204 when nobody is logged in', async () => {
      // When
      const response = await postJson(ctx.app, '/api/auth/logout');

      // Then
      expect(response.status).toBe(204);
    });
  });

  describe('request guard', () => {
    it('should answer 415 when a write request is not JSON', async () => {
      // When
      const response = await request(ctx.app)
        .post('/api/auth/login')
        .type('form')
        .send({ username: 'ash', password: TEST_PASSWORD });

      // Then
      expect(response.status).toBe(415);
    });

    it('should answer 415 when a write request has no content type', async () => {
      // When
      const response = await request(ctx.app).post('/api/auth/logout');

      // Then
      expect(response.status).toBe(415);
    });

    it('should answer 403 when the Origin is another site', async () => {
      // When
      const response = await login().set('Origin', 'https://evil.example');

      // Then
      expect(response.status).toBe(403);
    });

    it('should answer 403 when the Origin is not a valid URL', async () => {
      // When
      const response = await login().set('Origin', 'null');

      // Then
      expect(response.status).toBe(403);
    });

    it('should allow the request when the Origin matches the host', async () => {
      // When
      const response = await login()
        .set('Host', 'homedex.lan:3000')
        .set('Origin', 'http://homedex.lan:3000');

      // Then
      expect(response.status).toBe(200);
    });

    it('should not apply to read requests', async () => {
      // When
      const response = await request(ctx.app)
        .get('/api/auth/me')
        .set('Origin', 'https://evil.example');

      // Then
      expect(response.status).toBe(401);
    });
  });
});
