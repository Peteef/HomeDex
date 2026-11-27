import { describe, expect, expectTypeOf, it } from 'vitest';
import { valueIf } from '../valueIf.ts';

describe('valueIf', () => {
  it('should return the value when the condition is true', () => {
    // When
    const result = valueIf(true, 'shown');

    // Then
    expect(result).toBe('shown');
  });

  it('should return undefined when the condition is false', () => {
    // When
    const result = valueIf(false, 'shown');

    // Then
    expect(result).toBeUndefined();
  });

  it('should type the result as the value or undefined when called', () => {
    // When
    const result = valueIf(true, 42);

    // Then
    expectTypeOf(result).toEqualTypeOf<number | undefined>();
  });
});
