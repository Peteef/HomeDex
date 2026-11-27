import { describe, expect, expectTypeOf, it } from 'vitest';
import { definedProps } from '../definedProps.ts';

describe('definedProps', () => {
  it('should leave out a key when its value is undefined', () => {
    // When
    const props = definedProps({ name: 'Ash', error: undefined });

    // Then
    expect(props).toStrictEqual({ name: 'Ash' });
  });

  it('should keep a key when its value is empty, zero, false or null', () => {
    // When
    const props = definedProps({ text: '', count: 0, done: false, description: null });

    // Then
    expect(props).toStrictEqual({ text: '', count: 0, done: false, description: null });
  });

  it('should not change the input when it leaves out a key', () => {
    // Given
    const input = { name: 'Ash', error: undefined };

    // When
    const props = definedProps(input);

    // Then
    expect(input).toStrictEqual({ name: 'Ash', error: undefined });
    expect(props).not.toBe(input);
  });

  it('should type every key as optional without undefined when given optional values', () => {
    // Given
    const maybeName = 'Ash' as string | undefined;

    // When
    const props = definedProps({ name: maybeName, count: 0 });

    // Then
    expectTypeOf(props).toEqualTypeOf<{ name?: string; count?: number }>();
    // @ts-expect-error undefined is not a value the result can hold
    expectTypeOf<{ name: undefined }>().toExtend<typeof props>();
  });
});
