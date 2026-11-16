import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../../lib/http/index.ts';
import { loginFailure, passwordError } from '../loginMessages.ts';

describe('loginMessages', () => {
  describe('passwordError', () => {
    it('should ask for the password when it is empty', () => {
      // When / Then
      expect(passwordError('')).toBe('passwordRequired');
    });

    it('should return undefined when a password is typed', () => {
      // When / Then
      expect(passwordError('x')).toBeUndefined();
    });
  });

  describe('loginFailure', () => {
    it.each([
      ['a 401', new ApiError(401, ''), 'wrongPassword'],
      ['a 429', new ApiError(429, ''), 'tooManyAttempts'],
      ['a 500', new ApiError(500, ''), 'unexpected'],
      ['a plain error', new Error('offline'), 'unexpected'],
    ])(
      'should map the failure to its message when the login fails with %s',
      (_case, error, key) => {
        // When / Then
        expect(loginFailure(error)).toBe(key);
      },
    );
  });
});
