import { describe, expect, it } from 'vitest';
import { partOfDayAt, themeAt } from '../timeOfDay.ts';

const at = (hour: number, minute = 0): Date => new Date(2026, 5, 1, hour, minute);

describe('time of day', () => {
  describe('themeAt', () => {
    it.each([
      [at(0), 'night'],
      [at(6, 59), 'night'],
      [at(7), 'day'],
      [at(12), 'day'],
      [at(20, 59), 'day'],
      [at(21), 'night'],
      [at(23, 59), 'night'],
    ])('should return %s as %s', (date, expected) => {
      // When / Then
      expect(themeAt(date)).toBe(expected);
    });
  });

  describe('partOfDayAt', () => {
    it.each([
      [at(0), 'night'],
      [at(6, 59), 'night'],
      [at(7), 'morning'],
      [at(11, 59), 'morning'],
      [at(12), 'afternoon'],
      [at(18, 59), 'afternoon'],
      [at(19), 'evening'],
      [at(22, 59), 'evening'],
      [at(23), 'night'],
    ])('should return %s as %s', (date, expected) => {
      // When / Then
      expect(partOfDayAt(date)).toBe(expected);
    });
  });
});
