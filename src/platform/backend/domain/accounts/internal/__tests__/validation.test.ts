import { describe, expect, it } from 'vitest';
import { passwordSchema, usernameSchema, validate } from '../validation.ts';

describe('account validation', () => {
  describe('usernameSchema', () => {
    it('should accept the name when it uses letters, digits, ".", "_" and "-"', () => {
      // When
      const result = usernameSchema.safeParse('ash.k_1-x');

      // Then
      expect(result.success).toBe(true);
    });

    it.each([
      ['it is empty', ''],
      ['it is 33 characters long', 'a'.repeat(33)],
      ['it has a space', 'ash ketchum'],
      ['it has letters outside ASCII', 'zażółć'],
    ])('should reject the name when %s', (_case, username) => {
      // When
      const result = usernameSchema.safeParse(username);

      // Then
      expect(result.success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it.each([
      [7, false],
      [8, true],
      [128, true],
      [129, false],
    ])('should accept only 8 to 128 characters when the password has %i', (length, accepted) => {
      // When
      const result = passwordSchema.safeParse('a'.repeat(length));

      // Then
      expect(result.success).toBe(accepted);
    });
  });

  describe('validate', () => {
    it('should return the parsed value when it is valid', () => {
      // When
      const result = validate(usernameSchema, 'ash');

      // Then
      expect(result).toBe('ash');
    });

    it('should throw an invalid AccountError with the first message when the value is not valid', () => {
      // When / Then
      expect(() => validate(usernameSchema, '')).toThrow(
        expect.objectContaining({
          name: 'AccountError',
          code: 'invalid',
          message: 'Username is required',
        }),
      );
    });
  });
});
