import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../languages.ts';

describe('languages', () => {
  it('should give every supported language its flag in order when listing them', () => {
    // When / Then
    expect(LANGUAGES).toEqual([
      { code: 'en', flag: '🇬🇧' },
      { code: 'pl', flag: '🇵🇱' },
    ]);
  });
});
