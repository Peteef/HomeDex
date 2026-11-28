import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysBetween,
  isCalendarDate,
  nextWateringAfter,
  seasonOf,
  urgencyOf,
} from '../index.ts';

const INTERVALS = { summerIntervalDays: 7, winterIntervalDays: 30 };

describe('schedule', () => {
  describe('isCalendarDate', () => {
    it.each(['2026-03-31', '2028-02-29'])('should accept %s', (text) => {
      // When / Then
      expect(isCalendarDate(text)).toBe(true);
    });

    it.each(['2026-02-30', '2027-02-29', '2026-13-01', '2026-3-31', '2026-03-31T10:00', ''])(
      'should reject %s',
      (text) => {
        // When / Then
        expect(isCalendarDate(text)).toBe(false);
      },
    );
  });

  describe('seasonOf', () => {
    it.each([
      ['2026-03-31', 'winter'],
      ['2026-04-01', 'summer'],
      ['2026-09-30', 'summer'],
      ['2026-10-01', 'winter'],
      ['2028-02-29', 'winter'],
    ])('should place %s in %s', (date, season) => {
      // When / Then
      expect(seasonOf(date)).toBe(season);
    });
  });

  describe('addDays', () => {
    it.each([
      ['2026-06-03', 1, '2026-06-04'],
      ['2026-12-31', 1, '2027-01-01'],
      ['2028-02-28', 1, '2028-02-29'],
      ['2026-06-03', 30, '2026-07-03'],
    ])('should move %s by %i days to %s', (date, days, expected) => {
      // When / Then
      expect(addDays(date, days)).toBe(expected);
    });
  });

  describe('nextWateringAfter', () => {
    it('should add the summer interval to a summer watering', () => {
      // When / Then
      expect(nextWateringAfter(INTERVALS, '2026-07-15')).toBe('2026-07-22');
    });

    it('should add the winter interval to a winter watering', () => {
      // When / Then
      expect(nextWateringAfter(INTERVALS, '2026-11-15')).toBe('2026-12-15');
    });

    it('should use the season of the watering date across a season boundary', () => {
      // When / Then
      expect(nextWateringAfter(INTERVALS, '2026-03-20')).toBe('2026-04-19');
    });

    it('should cross a year end', () => {
      // When / Then
      expect(nextWateringAfter(INTERVALS, '2026-12-20')).toBe('2027-01-19');
    });

    it('should cross the end of a summer month', () => {
      // When / Then
      expect(nextWateringAfter(INTERVALS, '2026-06-28')).toBe('2026-07-05');
    });
  });

  describe('daysBetween', () => {
    it('should count the days forward', () => {
      // When / Then
      expect(daysBetween('2026-02-27', '2026-03-02')).toBe(3);
    });

    it('should be negative when the second date is earlier', () => {
      // When / Then
      expect(daysBetween('2026-03-02', '2026-02-27')).toBe(-3);
    });

    it('should be zero on the same day', () => {
      // When / Then
      expect(daysBetween('2026-03-02', '2026-03-02')).toBe(0);
    });
  });

  describe('urgencyOf', () => {
    it.each([
      [-1, 'overdue'],
      [0, 'today'],
      [1, 'soon'],
      [2, 'soon'],
      [3, 'later'],
    ])('should rate %i days until watering as %s', (daysUntil, urgency) => {
      // When / Then
      expect(urgencyOf(daysUntil)).toBe(urgency);
    });
  });
});
