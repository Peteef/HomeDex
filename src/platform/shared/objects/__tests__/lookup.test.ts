import { describe, expect, expectTypeOf, it } from 'vitest';
import { lookup } from '../lookup.ts';

const MESSAGES = { required: 'Required', invalid: 'Invalid' } as const;

type MessageKey = keyof typeof MESSAGES;

describe('lookup', () => {
  it('should return the value when the key is given', () => {
    // Given
    const key = 'invalid' as MessageKey | undefined;

    // When
    const message = lookup(MESSAGES, key);

    // Then
    expect(message).toBe('Invalid');
  });

  it('should return undefined when the key is undefined', () => {
    // Given
    const key = undefined as MessageKey | undefined;

    // When
    const message = lookup(MESSAGES, key);

    // Then
    expect(message).toBeUndefined();
  });

  it('should type the result as the value or undefined when the key may be undefined', () => {
    // Given
    const record: Record<MessageKey, string> = MESSAGES;
    const key = 'required' as MessageKey | undefined;

    // When
    const message = lookup(record, key);

    // Then
    expectTypeOf(message).toEqualTypeOf<string | undefined>();
  });
});
