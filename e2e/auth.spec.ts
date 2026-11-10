import { expect, test } from '@playwright/test';
import { E2E_ARCHIVED_USER, E2E_USER } from './fixtures.ts';

const json = { 'Content-Type': 'application/json' };

test.describe('auth', () => {
  test.describe('login', () => {
    test('should log in, stay logged in, and log out when the credentials are right', async ({
      request,
    }) => {
      // When
      const login = await request.post('/api/auth/login', { headers: json, data: E2E_USER });

      // Then
      expect(login.status()).toBe(200);
      expect(login.headers()['set-cookie']).toContain('HttpOnly');
      const me = await request.get('/api/auth/me');
      expect(await me.json()).toEqual({
        user: { id: expect.any(Number), username: E2E_USER.username },
      });
      const logout = await request.post('/api/auth/logout', { headers: json, data: {} });
      expect(logout.status()).toBe(204);
      expect((await request.get('/api/auth/me')).status()).toBe(401);
    });

    test('should refuse the login when the password is wrong', async ({ request }) => {
      // When
      const response = await request.post('/api/auth/login', {
        headers: json,
        data: { username: E2E_USER.username, password: 'not-the-password' },
      });

      // Then
      expect(response.status()).toBe(401);
    });

    test('should refuse the login when the account is archived', async ({ request }) => {
      // When
      const response = await request.post('/api/auth/login', {
        headers: json,
        data: E2E_ARCHIVED_USER,
      });

      // Then
      expect(response.status()).toBe(401);
    });

    test('should refuse a write from another origin when the browser sends a foreign Origin', async ({
      request,
    }) => {
      // When
      const response = await request.post('/api/auth/login', {
        headers: { ...json, Origin: 'https://evil.example' },
        data: E2E_USER,
      });

      // Then
      expect(response.status()).toBe(403);
    });
  });

  test.describe('me', () => {
    test('should refuse to read the current user when nobody is logged in', async ({ request }) => {
      // When
      const response = await request.get('/api/auth/me');

      // Then
      expect(response.status()).toBe(401);
    });
  });
});
