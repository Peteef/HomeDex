import { describe, expect, it } from 'vitest';
import { CalendarError, invalidMonth } from '../errors.ts';

describe('calendar errors', () => {
  it('should build an invalid month error with its message', () => {
    // When
    const error = invalidMonth('june is not a month');

    // Then
    expect(error).toBeInstanceOf(CalendarError);
    expect(error).toMatchObject({ code: 'invalid', message: 'june is not a month' });
  });
});
