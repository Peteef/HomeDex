import i18next from 'i18next';
import { afterEach, describe, expect, it } from 'vitest';

describe('i18n', () => {
  afterEach(async () => {
    await i18next.changeLanguage('en');
  });

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

  it('should fall back to English for a language without translations', async () => {
    // When
    await i18next.changeLanguage('pl');

    // Then
    expect(i18next.t('actions.tryAgain')).toBe('Try again');
  });
});
