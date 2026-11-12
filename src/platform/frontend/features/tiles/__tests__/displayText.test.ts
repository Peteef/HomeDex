import { describe, expect, it, vi } from 'vitest';
import { displayText } from '../index.ts';
import { linkTile, moduleTile } from './tiles.ts';

vi.mock('../../modules/index.ts', () => ({
  MODULE_TRANSLATIONS: [
    {
      namespace: 'shopping-list',
      language: 'en',
      messages: { manifest: { name: 'Shopping list', description: 'What we need' } },
    },
    {
      namespace: 'shopping-list',
      language: 'pl',
      messages: { manifest: { name: 'Lista zakupów' } },
    },
    { namespace: 'shopping-list', language: 'de', messages: { manifest: { name: 'Einkauf' } } },
    { namespace: 'clock', language: 'pl', messages: { manifest: { name: 'Zegar' } } },
    { namespace: 'no-name', language: 'en', messages: { list: { title: 'List' } } },
  ],
}));

const BUDGET = { title: 'Budget', description: 'Monthly costs' };
const BUDZET = { title: 'Budżet', description: null };

describe('displayText', () => {
  describe('of a link tile', () => {
    it('should show the text of the current language', () => {
      // Given
      const tile = linkTile({ en: BUDGET, pl: BUDZET });

      // When / Then
      expect(displayText(tile, 'pl')).toEqual(BUDZET);
      expect(displayText(tile, 'en')).toEqual(BUDGET);
    });

    it('should fall back to English when the current language has no text', () => {
      // Given
      const tile = linkTile({ en: BUDGET });

      // When / Then
      expect(displayText(tile, 'pl')).toEqual(BUDGET);
    });

    it('should fall back to any language when neither the current one nor English has text', () => {
      // Given
      const tile = linkTile({ pl: BUDZET });

      // When / Then
      expect(displayText(tile, 'en')).toEqual(BUDZET);
    });

    it('should show UNNAMED when the tile has no text in any language', () => {
      // When / Then
      expect(displayText(linkTile({}), 'en')).toEqual({ title: 'UNNAMED', description: null });
    });

    it('should never mix the description of another language in', () => {
      // Given
      const tile = linkTile({ en: BUDGET, pl: BUDZET });

      // When
      const text = displayText(tile, 'pl');

      // Then
      expect(text.description).toBeNull();
    });
  });

  describe('of a module tile', () => {
    it("should show the name and description from the module's locale files", () => {
      // When / Then
      expect(displayText(moduleTile('shopping-list'), 'en')).toEqual({
        title: 'Shopping list',
        description: 'What we need',
      });

      expect(displayText(moduleTile('shopping-list'), 'pl')).toEqual({
        title: 'Lista zakupów',
        description: null,
      });
    });

    it('should fall back the same way as a link tile', () => {
      // When / Then
      expect(displayText(moduleTile('clock'), 'en')).toEqual({ title: 'Zegar', description: null });
    });

    it('should show the module id when the module has no name in any language', () => {
      // When / Then
      expect(displayText(moduleTile('no-name'), 'en')).toEqual({
        title: 'no-name',
        description: null,
      });

      expect(displayText(moduleTile('removed'), 'pl')).toEqual({
        title: 'removed',
        description: null,
      });
    });
  });
});
