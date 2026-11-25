import { describe, expect, it } from 'vitest';
import {
  invalidWatering,
  plantNotDue,
  plantNotFound,
  undoUnavailable,
  WateringError,
  wateringNotFound,
} from '../errors.ts';

describe('watering errors', () => {
  it('should build an invalid watering error with its message', () => {
    // When
    const error = invalidWatering('The dates are not possible');

    // Then
    expect(error).toBeInstanceOf(WateringError);
    expect(error).toMatchObject({ code: 'invalid', message: 'The dates are not possible' });
  });

  it('should build a not found error naming the plant', () => {
    // When
    const error = plantNotFound(42);

    // Then
    expect(error).toMatchObject({ code: 'not_found', message: 'No plant with id 42' });
  });

  it('should build a not found error naming the watering', () => {
    // When
    const error = wateringNotFound(7);

    // Then
    expect(error).toMatchObject({ code: 'not_found', message: 'No watering with id 7' });
  });

  it('should build a conflict when the plant is not due', () => {
    // When
    const error = plantNotDue(42);

    // Then
    expect(error).toMatchObject({ code: 'conflict', message: 'Plant 42 is not due' });
  });

  it('should build a conflict when the undo is no longer possible', () => {
    // When
    const error = undoUnavailable(7);

    // Then
    expect(error).toMatchObject({
      code: 'conflict',
      message: 'Watering 7 can no longer be undone',
    });
  });
});
