import { describe, expect, it } from 'vitest';
import { ItemError, invalidItem, itemNotFound } from '../errors.ts';

describe('item errors', () => {
  it('should make an invalid-item error with the given message', () => {
    // When
    const error = invalidItem('The item text is empty');

    // Then
    expect(error).toBeInstanceOf(ItemError);
    expect(error).toMatchObject({ code: 'invalid', message: 'The item text is empty' });
  });

  it('should make a not-found error naming the id', () => {
    // When
    const error = itemNotFound(42);

    // Then
    expect(error).toBeInstanceOf(ItemError);
    expect(error).toMatchObject({ code: 'not_found', message: 'No item with id 42' });
  });
});
