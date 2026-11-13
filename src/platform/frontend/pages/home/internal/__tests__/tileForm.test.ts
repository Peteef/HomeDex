import { describe, expect, it } from 'vitest';
import { linkTile } from '../../../../__tests__/tiles.ts';
import type { TileFormValues } from '../../types.ts';
import {
  hasErrors,
  missingLanguages,
  newTileValues,
  tileValues,
  toDraft,
  validateTile,
  withLanguage,
  withoutLanguage,
  withText,
} from '../tileForm.ts';

const values = (changes: Partial<TileFormValues> = {}): TileFormValues => ({
  texts: [{ language: 'en', title: 'Finances', description: '' }],
  url: 'https://docs.example.com/budget',
  icon: 'wallet',
  scope: 'personal',
  ...changes,
});

describe('tile form', () => {
  describe('newTileValues', () => {
    it('should start with one empty block in the current language, a link icon and personal scope', () => {
      // When
      const result = newTileValues('pl');

      // Then
      expect(result).toEqual({
        texts: [{ language: 'pl', title: '', description: '' }],
        url: '',
        icon: 'link',
        scope: 'personal',
      });
    });
  });

  describe('tileValues', () => {
    it('should show every language of the tile, the current language first', () => {
      // Given
      const tile = linkTile(
        {
          en: { title: 'Finances', description: null },
          pl: { title: 'Finanse', description: 'Budżet' },
        },
        { url: 'https://docs.example.com/budget', icon: 'bank', scope: 'shared' },
      );

      // When
      const result = tileValues(tile, 'pl');

      // Then
      expect(result).toEqual({
        texts: [
          { language: 'pl', title: 'Finanse', description: 'Budżet' },
          { language: 'en', title: 'Finances', description: '' },
        ],
        url: 'https://docs.example.com/budget',
        icon: 'bank',
        scope: 'shared',
      });
    });

    it('should leave out the current language when the tile does not have it', () => {
      // Given
      const tile = linkTile({ en: { title: 'Finances', description: null } });

      // When
      const result = tileValues(tile, 'pl');

      // Then
      expect(result.texts.map(({ language }) => language)).toEqual(['en']);
    });

    it('should fall back to the link icon when the stored icon is unknown', () => {
      // Given
      const tile = linkTile({ en: { title: 'Finances', description: null } }, { icon: 'unicorn' });

      // When
      const result = tileValues(tile, 'en');

      // Then
      expect(result.icon).toBe('link');
    });
  });

  describe('missingLanguages', () => {
    it('should list the supported languages without a block', () => {
      // When / Then
      expect(missingLanguages(values())).toEqual(['pl']);
    });
  });

  describe('withLanguage', () => {
    it('should add an empty block for the language', () => {
      // When
      const result = withLanguage(values(), 'pl');

      // Then
      expect(result.texts).toEqual([
        { language: 'en', title: 'Finances', description: '' },
        { language: 'pl', title: '', description: '' },
      ]);
    });
  });

  describe('withoutLanguage', () => {
    it('should remove the block of the language', () => {
      // Given
      const both = withLanguage(values(), 'pl');

      // When
      const result = withoutLanguage(both, 'en');

      // Then
      expect(result.texts).toEqual([{ language: 'pl', title: '', description: '' }]);
    });

    it('should keep the last block', () => {
      // When
      const result = withoutLanguage(values(), 'en');

      // Then
      expect(result.texts).toHaveLength(1);
    });
  });

  describe('withText', () => {
    it('should replace the block of the same language', () => {
      // When
      const result = withText(values(), {
        language: 'en',
        title: 'Budget',
        description: 'Monthly',
      });

      // Then
      expect(result.texts).toEqual([{ language: 'en', title: 'Budget', description: 'Monthly' }]);
    });
  });

  describe('validateTile', () => {
    it('should find nothing wrong with a title and a web address', () => {
      // When
      const errors = validateTile(values());

      // Then
      expect(errors).toEqual({ titles: {} });
      expect(hasErrors(errors)).toBe(false);
    });

    it('should ask for a title in the first block when every block is empty', () => {
      // Given
      const empty = values({
        texts: [
          { language: 'pl', title: ' ', description: '' },
          { language: 'en', title: '', description: '' },
        ],
      });

      // When
      const errors = validateTile(empty);

      // Then
      expect(errors.titles).toEqual({ pl: 'titleRequired' });
      expect(hasErrors(errors)).toBe(true);
    });

    it('should ask for a title in a block that has only a description', () => {
      // Given
      const descriptionOnly = values({
        texts: [
          { language: 'en', title: 'Finances', description: '' },
          { language: 'pl', title: '', description: 'Budżet' },
        ],
      });

      // When
      const errors = validateTile(descriptionOnly);

      // Then
      expect(errors.titles).toEqual({ pl: 'titleRequired' });
    });

    it('should accept an empty extra block, which is dropped on save', () => {
      // Given
      const withEmptyBlock = withLanguage(values(), 'pl');

      // When
      const errors = validateTile(withEmptyBlock);

      // Then
      expect(hasErrors(errors)).toBe(false);
    });

    it('should ask for the address when it is blank', () => {
      // When
      const errors = validateTile(values({ url: '  ' }));

      // Then
      expect(errors.url).toBe('urlRequired');
    });

    it('should reject an address without http:// or https://', () => {
      // When
      const errors = validateTile(values({ url: 'docs.example.com' }));

      // Then
      expect(errors.url).toBe('urlInvalid');
    });

    it('should accept a local network address', () => {
      // When
      const errors = validateTile(values({ url: 'http://192.168.1.10:8123' }));

      // Then
      expect(errors.url).toBeUndefined();
    });
  });

  describe('toDraft', () => {
    it('should trim the text, drop empty blocks and turn an empty description into null', () => {
      // Given
      const form = values({
        texts: [
          { language: 'en', title: ' Finances ', description: '  ' },
          { language: 'pl', title: '', description: '' },
        ],
        url: ' https://docs.example.com/budget ',
      });

      // When
      const draft = toDraft(form);

      // Then
      expect(draft).toEqual({
        texts: { en: { title: 'Finances', description: null } },
        url: 'https://docs.example.com/budget',
        icon: 'wallet',
        scope: 'personal',
      });
    });
  });
});
