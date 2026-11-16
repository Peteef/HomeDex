import { describe, expect, it } from 'vitest';
import { isLanguage, SOURCE_LANGUAGE } from '../languages.ts';

describe('languages', () => {
  describe('isLanguage', () => {
    it.each(['en', 'pl'])('should be true when the code is %s', (code) => {
      // When / Then
      expect(isLanguage(code)).toBe(true);
    });

    it.each(['de', 'EN', ''])('should be false when the code is "%s"', (code) => {
      // When / Then
      expect(isLanguage(code)).toBe(false);
    });
  });

  it('should use English as the source language when read', () => {
    // When / Then
    expect(SOURCE_LANGUAGE).toBe('en');
  });
});
