import { describe, expect, it } from 'vitest';
import { invalidPlant, PlantError, plantNotFound } from '../errors.ts';

describe('plant errors', () => {
  it('should build an invalid plant error with its message', () => {
    // When
    const error = invalidPlant('The name is empty');

    // Then
    expect(error).toBeInstanceOf(PlantError);
    expect(error).toMatchObject({ code: 'invalid', message: 'The name is empty' });
  });

  it('should build a not found error naming the id', () => {
    // When
    const error = plantNotFound(42);

    // Then
    expect(error).toMatchObject({ code: 'not_found', message: 'No plant with id 42' });
  });
});
