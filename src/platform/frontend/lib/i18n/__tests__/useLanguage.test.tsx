import { act, renderHook, waitFor } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGES } from '../languages.ts';
import { useLanguage } from '../useLanguage.ts';

describe('useLanguage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return English and the supported languages when nothing was picked', () => {
    // When
    const { result } = renderHook(useLanguage);

    // Then
    expect(result.current.language).toBe('en');
    expect(result.current.languages).toBe(LANGUAGES);
  });

  it("should switch the app's language and store the choice when a language is picked", async () => {
    // Given
    const { result } = renderHook(useLanguage);

    // When
    act(() => {
      result.current.change('pl');
    });

    // Then
    await waitFor(() => {
      expect(result.current.language).toBe('pl');
    });

    expect(i18next.resolvedLanguage).toBe('pl');
    expect(localStorage.getItem('homedex.language')).toBe('pl');
  });

  it('should still switch the language when storage is blocked', async () => {
    // Given
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(useLanguage);

    // When
    act(() => {
      result.current.change('pl');
    });

    // Then
    await waitFor(() => {
      expect(result.current.language).toBe('pl');
    });
  });
});
