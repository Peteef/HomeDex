import { ApiError } from '#platform/frontend';
import { describe, expect, it } from 'vitest';
import { isConflict } from '../index.ts';

describe('isConflict', () => {
  it('should recognise a 409 answer', () => {
    // When / Then
    expect(isConflict(new ApiError(409, 'conflict'))).toBe(true);
  });

  it.each([
    ['another status', new ApiError(404, 'not found')],
    ['another error', new Error('offline')],
  ])('should not take %s for a conflict', (_kind, error) => {
    // When / Then
    expect(isConflict(error)).toBe(false);
  });
});
