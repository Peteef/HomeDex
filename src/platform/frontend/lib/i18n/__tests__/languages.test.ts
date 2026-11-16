import { describe, expect, it } from 'vitest';
import { LANGUAGE_STORAGE_KEY, LANGUAGES } from '../languages.ts';

describe('languages', () => {
  it('should list every language with its flag when read', () => {
    // When / Then
    expect(LANGUAGES).toEqual([
      { code: 'en', flag: '🇬🇧' },
      { code: 'pl', flag: '🇵🇱' },
    ]);
  });

  it('should store the choice under the HomeDex key when read', () => {
    // When / Then
    expect(LANGUAGE_STORAGE_KEY).toBe('homedex.language');
  });
});
