import { describe, expect, it } from 'vitest';
import { isYearMonth, monthOf, monthsBetween } from '../yearMonth.ts';

describe('yearMonth', () => {
  describe('isYearMonth', () => {
    it.each(['2026-06', '2028-02'])('should accept %s', (text) => {
      // When / Then
      expect(isYearMonth(text)).toBe(true);
    });

    it.each(['2026-13', '2026-00', '2026-6', '2026-06-01', 'june', ''])(
      'should reject %s',
      (text) => {
        // When / Then
        expect(isYearMonth(text)).toBe(false);
      },
    );
  });

  describe('monthOf', () => {
    it('should give the month of a date', () => {
      // When / Then
      expect(monthOf('2026-06-03')).toBe('2026-06');
    });
  });

  describe('monthsBetween', () => {
    it.each([
      ['2026-06', '2026-06', 0],
      ['2026-06', '2027-06', 12],
      ['2026-12', '2027-01', 1],
      ['2026-06', '2026-05', -1],
    ])('should count from %s to %s as %i', (from, to, months) => {
      // When / Then
      expect(monthsBetween(from, to)).toBe(months);
    });
  });
});
