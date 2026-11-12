import { describe, expect, it } from 'vitest';
import { isWebUrl } from '../linkTileRules.ts';

describe('link tile rules', () => {
  describe('isWebUrl', () => {
    it.each([
      'https://docs.example.com/budget',
      'http://192.168.1.10:8123',
      'http://dashboard.local:8123/lovelace',
    ])('should accept %s', (url) => {
      // When / Then
      expect(isWebUrl(url)).toBe(true);
    });

    it.each(['docs.example.com', 'javascript:alert(1)', 'file:///budget.xlsx', ''])(
      'should reject "%s"',
      (url) => {
        // When / Then
        expect(isWebUrl(url)).toBe(false);
      },
    );
  });
});
