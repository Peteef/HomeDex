import { describe, expect, it } from 'vitest';
import { LANGUAGE_CODES } from '../../../../../shared/i18n/languages.ts';
import { MODULE_PAGES, MODULE_TRANSLATIONS } from '../discovery.ts';

describe('module discovery', () => {
  it('should give every page the route /m/<id> when the modules are found', () => {
    // When / Then
    for (const page of MODULE_PAGES) {
      expect(page.route).toBe(`/m/${page.id}`);
    }
  });

  it('should find a translation in every language under the module id when a module has a page', () => {
    // When / Then
    for (const { id } of MODULE_PAGES) {
      const languages = MODULE_TRANSLATIONS.filter(({ namespace }) => namespace === id).map(
        ({ language }) => language,
      );

      expect(languages).toEqual(expect.arrayContaining([...LANGUAGE_CODES]));
    }
  });

  it('should never load the locales index as a translation when reading the locale files', () => {
    // When
    const languages = MODULE_TRANSLATIONS.map(({ language }) => language);

    // Then
    expect(languages).not.toContain('index');
  });
});
