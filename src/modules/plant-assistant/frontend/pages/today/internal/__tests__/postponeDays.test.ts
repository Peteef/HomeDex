import { describe, expect, it } from 'vitest';
import { isPostponeDays } from '../postponeDays.ts';

describe('isPostponeDays', () => {
  it.each([1, 7, 30])('should accept %s days', (days) => {
    // When / Then
    expect(isPostponeDays(days)).toBe(true);
  });

  it.each([0, 31, 1.5, -2, Number.NaN])('should refuse %s days', (days) => {
    // When / Then
    expect(isPostponeDays(days)).toBe(false);
  });
});
