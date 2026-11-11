import { describe, expect, it } from 'vitest';
import { fakeApi, ok, status } from '../../__tests__/helpers.tsx';
import { ApiError, getJson, isClientError, isUnauthorized, post, postJson } from '../client.ts';

describe('http client', () => {
  describe('getJson', () => {
    it('should read the JSON body from the API path', async () => {
      // Given
      fakeApi({ 'GET /api/things': ok({ things: [1] }) });

      // When
      const body = await getJson('/things');

      // Then
      expect(body).toEqual({ things: [1] });
    });

    it('should throw an ApiError with the status when the response is not ok', async () => {
      // Given
      fakeApi({ 'GET /api/things': status(503) });

      // When
      const result = getJson('/things');

      // Then
      await expect(result).rejects.toBeInstanceOf(ApiError);
      await expect(result).rejects.toMatchObject({ status: 503 });
    });
  });

  describe('postJson', () => {
    it('should send the body as JSON with the JSON content type', async () => {
      // Given
      const api = fakeApi({ 'POST /api/things': ok({ id: 7 }) });

      // When
      const body = await postJson('/things', { name: 'Pikachu' });

      // Then
      expect(body).toEqual({ id: 7 });
      const [call] = api.calls;
      expect(call?.headers.get('Content-Type')).toBe('application/json');
      expect(call?.body).toEqual({ name: 'Pikachu' });
    });
  });

  describe('post', () => {
    it('should send the JSON content type and an empty object when there is no body', async () => {
      // Given
      const api = fakeApi({ 'POST /api/things/reset': { status: 204 } });

      // When
      await post('/things/reset');

      // Then
      const [call] = api.calls;
      expect(call?.headers.get('Content-Type')).toBe('application/json');
      expect(call?.body).toEqual({});
    });
  });

  describe('isUnauthorized', () => {
    it.each([
      [new ApiError(401, 'x'), true],
      [new ApiError(403, 'x'), false],
      [new Error('x'), false],
    ])('should tell whether %o is a 401', (error, expected) => {
      // When / Then
      expect(isUnauthorized(error)).toBe(expected);
    });
  });

  describe('isClientError', () => {
    it.each([
      [new ApiError(400, 'x'), true],
      [new ApiError(429, 'x'), true],
      [new ApiError(500, 'x'), false],
      [new TypeError('Failed to fetch'), false],
    ])('should tell whether %o is a 4xx', (error, expected) => {
      // When / Then
      expect(isClientError(error)).toBe(expected);
    });
  });
});
