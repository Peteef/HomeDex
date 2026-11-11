import i18next from 'i18next';
import { describe, expect, it } from 'vitest';

describe('i18n', () => {
  it('should mark the page as English by default', () => {
    // When / Then
    expect(document.documentElement.lang).toBe('en');
  });

  it('should mark the page with the language the user switches to', async () => {
    // When
    await i18next.changeLanguage('pl');

    // Then
    expect(document.documentElement.lang).toBe('pl');
  });

  it('should use English for a language it does not support', async () => {
    // When
    await i18next.changeLanguage('de');

    // Then
    expect(i18next.resolvedLanguage).toBe('en');
    expect(i18next.t('common.actions.tryAgain')).toBe('Try again');
  });
});
