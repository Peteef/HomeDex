import { describe, expect, it } from 'vitest';
import { addMonths, monthOf, nextMonth, previousMonth } from '../index.ts';

describe('yearMonth', () => {
  describe('addMonths', () => {
    it.each([
      ['2026-11', 1, '2026-12'],
      ['2026-12', 1, '2027-01'],
      ['2027-01', -1, '2026-12'],
      ['2026-11', 12, '2027-11'],
      ['2026-03', -3, '2025-12'],
    ])('should step %s by %i to %s', (month, months, expected) => {
      // When / Then
      expect(addMonths(month, months)).toBe(expected);
    });
  });

  describe('nextMonth', () => {
    it.each([
      ['2026-11', '2026-12'],
      ['2026-12', '2027-01'],
    ])('should follow %s with %s', (month, expected) => {
      // When / Then
      expect(nextMonth(month)).toBe(expected);
    });
  });

  describe('previousMonth', () => {
    it.each([
      ['2026-11', '2026-10'],
      ['2027-01', '2026-12'],
    ])('should precede %s with %s', (month, expected) => {
      // When / Then
      expect(previousMonth(month)).toBe(expected);
    });
  });

  describe('monthOf', () => {
    it('should take the month of a date', () => {
      // When / Then
      expect(monthOf('2026-11-20')).toBe('2026-11');
    });
  });
});
