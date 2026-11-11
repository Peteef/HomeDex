import { describe, expect, it } from 'vitest';
import { fakeApi, signedIn, signedOut, status, TEST_USER } from '../../__tests__/helpers.tsx';
import { fetchCurrentUser, login, logout } from '../authApi.ts';

describe('auth API', () => {
  describe('fetchCurrentUser', () => {
    it('should return the user when the session is valid', async () => {
      // Given
      fakeApi({ 'GET /api/auth/me': signedIn() });

      // When / Then
      expect(await fetchCurrentUser()).toEqual(TEST_USER);
    });

    it('should return null when nobody is signed in', async () => {
      // Given
      fakeApi({ 'GET /api/auth/me': signedOut() });

      // When / Then
      expect(await fetchCurrentUser()).toBeNull();
    });

    it('should throw when the server fails', async () => {
      // Given
      fakeApi({ 'GET /api/auth/me': status(500) });

      // When / Then
      await expect(fetchCurrentUser()).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('login', () => {
    it('should send the credentials and return the user', async () => {
      // Given
      const api = fakeApi({ 'POST /api/auth/login': signedIn() });

      // When
      const user = await login({ username: 'Misty', password: 'fake-password' });

      // Then
      expect(user).toEqual(TEST_USER);
      expect(api.calls[0]?.body).toEqual({ username: 'Misty', password: 'fake-password' });
    });
  });

  describe('logout', () => {
    it('should post to the logout endpoint', async () => {
      // Given
      const api = fakeApi({ 'POST /api/auth/logout': { status: 204 } });

      // When
      await logout();

      // Then
      expect(api.callsTo('POST /api/auth/logout')).toHaveLength(1);
    });
  });
});
