import { describe, expect, it } from 'vitest';
import { parsePostponeDays } from '../postponeDays.ts';

describe('parsePostponeDays', () => {
  it.each([
    ['1', 1],
    ['30', 30],
    [' 7 ', 7],
  ])('should accept "%s"', (text, days) => {
    // When / Then
    expect(parsePostponeDays(text)).toBe(days);
  });

  it.each(['0', '31', '1.5', '', '-2', 'two'])('should refuse "%s"', (text) => {
    // When / Then
    expect(parsePostponeDays(text)).toBeNull();
  });
});
