import { describe, expect, it } from 'vitest';
import { isLanguage } from '../languages.ts';

describe('languages', () => {
  describe('isLanguage', () => {
    it.each(['en', 'pl'])('should be true when the code is %s', (code) => {
      // When / Then
      expect(isLanguage(code)).toBe(true);
    });

    it.each(['xx', 'EN', ''])('should be false when the code is "%s"', (code) => {
      // When / Then
      expect(isLanguage(code)).toBe(false);
    });
  });
});
