import { describe, expect, expectTypeOf, it } from 'vitest';
import { includeIf } from '../includeIf.ts';

interface Item {
  text: string;
  amount?: string;
}

describe('includeIf', () => {
  it('should return the props when the condition is true', () => {
    // Given
    const props = { amount: '2 l' };

    // When / Then
    expect(includeIf(true, props)).toBe(props);
  });

  it('should return an empty object when the condition is false', () => {
    // When / Then
    expect(includeIf(false, { amount: '2 l' })).toEqual({});
  });

  it('should type the props as optional keys', () => {
    // When / Then
    expectTypeOf(includeIf(true, { amount: 'x' })).toEqualTypeOf<{ amount?: string }>();
  });

  it('should leave an optional key out where undefined would not type-check', () => {
    // When
    const withIncludeIf: Item = { text: 'Milk', ...includeIf(false, { amount: '2 l' }) };
    // @ts-expect-error exactOptionalPropertyTypes rejects an optional key set to undefined.
    const withUndefined: Item = { text: 'Milk', amount: undefined };

    // Then
    expect(Object.keys(withIncludeIf)).toEqual(['text']);
    expect(Object.keys(withUndefined)).toEqual(['text', 'amount']);
  });
});
