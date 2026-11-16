import cookieParser from 'cookie-parser';
import express from 'express';
import type { Express } from 'express';
import request from 'supertest';
import type { Response } from 'supertest';
import { describe, expect, it } from 'vitest';
import { sessionCookies } from '../sessionCookie.ts';
import type { SessionCookies } from '../sessionCookie.ts';

const NOW = 1_000;
const EXPIRES_AT = 61_000;

const appWith = (cookies: SessionCookies): Express => {
  const app = express();

  app.get('/set', (_req, res) => {
    cookies.set(res, 'token-1', EXPIRES_AT);
    res.end();
  });

  app.get('/clear', (_req, res) => {
    cookies.clear(res);
    res.end();
  });

  return app;
};

const setCookieOf = (response: Response): string =>
  (response.headers['set-cookie'] as string[] | undefined)?.join('\n') ?? '';

describe('sessionCookies', () => {
  describe('set', () => {
    it('should write a hardened session cookie when a session starts', async () => {
      // Given
      const app = appWith(sessionCookies(false, () => NOW));

      // When
      const response = await request(app).get('/set');

      // Then
      const cookie = setCookieOf(response);
      expect(cookie).toContain('hd_session=token-1');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).not.toContain('Secure');
    });

    it('should add Secure when the cookies are created as secure', async () => {
      // Given
      const app = appWith(sessionCookies(true, () => NOW));

      // When
      const response = await request(app).get('/set');

      // Then
      expect(setCookieOf(response)).toContain('Secure');
    });

    it("should give the cookie the session's remaining lifetime when it is set", async () => {
      // Given
      const app = appWith(sessionCookies(false, () => NOW));

      // When
      const response = await request(app).get('/set');

      // Then
      expect(setCookieOf(response)).toContain('Max-Age=60');
    });
  });

  describe('read', () => {
    const readCookie = async (cookieHeader?: string): Promise<string | undefined> => {
      const cookies = sessionCookies(false, () => NOW);
      const app = express();
      let value: string | undefined;

      app.use(cookieParser());

      app.get('/read', (req, res) => {
        value = cookies.read(req);
        res.end();
      });

      const call = request(app).get('/read');
      await (cookieHeader === undefined ? call : call.set('Cookie', cookieHeader));
      return value;
    };

    it("should return the cookie's value when the cookie is sent", async () => {
      // When
      const value = await readCookie('hd_session=token-1');

      // Then
      expect(value).toBe('token-1');
    });

    it.each([
      ['missing', undefined],
      ['empty', 'hd_session='],
    ])('should return undefined when the cookie is %s', async (_case, cookieHeader) => {
      // When
      const value = await readCookie(cookieHeader);

      // Then
      expect(value).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should expire the cookie when the session ends', async () => {
      // Given
      const app = appWith(sessionCookies(false, () => NOW));

      // When
      const response = await request(app).get('/clear');

      // Then
      const cookie = setCookieOf(response);
      expect(cookie).toContain('hd_session=;');
      expect(cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });
  });
});
