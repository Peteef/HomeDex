import { describe, expect, it } from 'vitest';
import { dateOf } from '../dateOf.ts';

describe('dateOf', () => {
  it('should give the date in the time zone when it is already tomorrow there', () => {
    // When / Then
    expect(dateOf(Date.parse('2026-03-31T22:30:00Z'), 'Europe/Warsaw')).toBe('2026-04-01');
  });

  it('should give the same date as UTC when the zone is UTC', () => {
    // When / Then
    expect(dateOf(Date.parse('2026-03-31T22:30:00Z'), 'UTC')).toBe('2026-03-31');
  });

  it('should follow the daylight saving change when the offset grows', () => {
    // When / Then
    expect(dateOf(Date.parse('2026-03-28T23:30:00Z'), 'Europe/Warsaw')).toBe('2026-03-29');
    expect(dateOf(Date.parse('2026-03-29T22:30:00Z'), 'Europe/Warsaw')).toBe('2026-03-30');
  });
});
