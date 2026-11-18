import { afterEach, describe, expect, it } from 'vitest';
import { applyTimeOfDay, partOfDayAt, timeOfDayAt } from '../timeOfDay.ts';

const at = (hour: number, minute = 0): Date => new Date(2026, 5, 1, hour, minute);

describe('time of day', () => {
  describe('timeOfDayAt', () => {
    it.each([
      [at(7), 'day'],
      [at(12), 'day'],
      [at(20, 59), 'day'],
      [at(21), 'night'],
      [at(0), 'night'],
      [at(6, 59), 'night'],
    ])('should return %s as %s', (date, expected) => {
      // When / Then
      expect(timeOfDayAt(date)).toBe(expected);
    });
  });

  describe('partOfDayAt', () => {
    it.each([
      [at(5), 'morning'],
      [at(11, 59), 'morning'],
      [at(12), 'afternoon'],
      [at(17, 59), 'afternoon'],
      [at(18), 'evening'],
      [at(22, 59), 'evening'],
      [at(23), 'night'],
      [at(4, 59), 'night'],
    ])('should return %s as %s', (date, expected) => {
      // When / Then
      expect(partOfDayAt(date)).toBe(expected);
    });
  });

  describe('applyTimeOfDay', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('data-time-of-day');
    });

    it('should mark the root element with the time of day when it is applied', () => {
      // When
      applyTimeOfDay('night');

      // Then
      expect(document.documentElement).toHaveAttribute('data-time-of-day', 'night');
    });

    it('should replace the previous time of day when another one is applied', () => {
      // Given
      applyTimeOfDay('night');

      // When
      applyTimeOfDay('day');

      // Then
      expect(document.documentElement).toHaveAttribute('data-time-of-day', 'day');
    });
  });
});
