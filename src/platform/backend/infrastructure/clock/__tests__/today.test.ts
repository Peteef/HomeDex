import { describe, expect, it } from 'vitest';
import { todayIn } from '../today.ts';

const at = (instant: string) => () => Date.parse(instant);

describe('todayIn', () => {
  it('should give the date in the time zone when it is already tomorrow there', () => {
    // Given
    const today = todayIn('Europe/Warsaw', at('2026-03-31T22:30:00Z'));

    // When / Then
    expect(today()).toBe('2026-04-01');
  });

  it('should give the same date as UTC when the zone is UTC', () => {
    // Given
    const today = todayIn('UTC', at('2026-03-31T22:30:00Z'));

    // When / Then
    expect(today()).toBe('2026-03-31');
  });

  it('should follow the daylight saving change when the offset grows', () => {
    // Given
    const beforeTheChange = todayIn('Europe/Warsaw', at('2026-03-28T23:30:00Z'));
    const afterTheChange = todayIn('Europe/Warsaw', at('2026-03-29T22:30:00Z'));

    // When / Then
    expect(beforeTheChange()).toBe('2026-03-29');
    expect(afterTheChange()).toBe('2026-03-30');
  });

  it('should read the clock again when it is called later', () => {
    // Given
    let now = Date.parse('2026-06-30T12:00:00Z');
    const today = todayIn('UTC', () => now);
    const first = today();

    // When
    now = Date.parse('2026-07-01T12:00:00Z');

    // Then
    expect(first).toBe('2026-06-30');
    expect(today()).toBe('2026-07-01');
  });
});
