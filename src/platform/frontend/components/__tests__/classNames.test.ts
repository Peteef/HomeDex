import { describe, expect, it } from 'vitest';
import { classNames } from '../classNames.ts';

describe('classNames', () => {
  it('should join the parts with spaces when all are given', () => {
    // When
    const result = classNames('panel', 'rounded', 'shadow');

    // Then
    expect(result).toBe('panel rounded shadow');
  });

  it('should leave out empty parts when some are false, null, undefined or empty', () => {
    // When
    const result = classNames('panel', false, null, undefined, '', 'shadow');

    // Then
    expect(result).toBe('panel shadow');
  });
});
