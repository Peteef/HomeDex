import { act, renderHook } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLanguage } from '../useLanguage.ts';

describe('useLanguage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the current language and the list of languages when rendered', () => {
    // When
    const { result } = renderHook(useLanguage);

    // Then
    expect(result.current.language).toBe('en');

    expect(result.current.languages).toEqual([
      { code: 'en', flag: '🇬🇧' },
      { code: 'pl', flag: '🇵🇱' },
    ]);
  });

  it("should switch the app's language and store the choice when a language is picked", async () => {
    // Given
    const { result } = renderHook(useLanguage);

    // When
    await act(async () => {
      result.current.change('pl');
      await Promise.resolve();
    });

    // Then
    expect(i18next.resolvedLanguage).toBe('pl');
    expect(result.current.language).toBe('pl');
    expect(localStorage.getItem('homedex.language')).toBe('pl');
  });

  it('should still switch the language when storage is blocked', async () => {
    // Given
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(useLanguage);

    // When
    await act(async () => {
      result.current.change('pl');
      await Promise.resolve();
    });

    // Then
    expect(i18next.resolvedLanguage).toBe('pl');
  });
});
