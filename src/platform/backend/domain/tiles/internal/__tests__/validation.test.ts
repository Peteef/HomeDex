import { describe, expect, it } from 'vitest';
import { linkTileSchema, validate } from '../validation.ts';

const validTile = {
  texts: { en: { title: 'Budget', description: 'Monthly spending' } },
  icon: 'wallet',
  url: 'https://docs.example.com/budget',
  scope: 'personal',
};

describe('tile validation', () => {
  describe('validate', () => {
    it('should trim the text and the URL and turn an empty description into null', () => {
      // Given
      const tile = {
        ...validTile,
        texts: { en: { title: '  Budget  ', description: '   ' }, pl: { title: 'Budżet' } },
        url: '  http://192.168.1.10:8123  ',
      };

      // When
      const result = validate(linkTileSchema, tile);

      // Then
      expect(result).toEqual({
        texts: {
          en: { title: 'Budget', description: null },
          pl: { title: 'Budżet', description: null },
        },
        icon: 'wallet',
        url: 'http://192.168.1.10:8123',
        scope: 'personal',
      });
    });

    it.each([
      ['an empty title', { texts: { en: { title: '  ' } } }, 'Title is required'],
      [
        'a title over 60 characters',
        { texts: { en: { title: 'a'.repeat(61) } } },
        'Title must be at most 60 characters',
      ],
      [
        'a description over 140 characters',
        { texts: { en: { title: 'Budget', description: 'a'.repeat(141) } } },
        'Description must be at most 140 characters',
      ],
      ['an unknown language', { texts: { xx: { title: 'Budget' } } }, 'Unknown language'],
      ['no language', { texts: {} }, 'A title in at least one language is required'],
      [
        'a URL that is not http(s)',
        { url: 'file:///budget.xlsx' },
        'URL must be a web address starting with http:// or https://',
      ],
      [
        'a URL over 2048 characters',
        { url: `https://example.com/${'a'.repeat(2048)}` },
        'URL must be at most 2048 characters',
      ],
      ['an unknown icon', { icon: 'rocket-ship' }, 'Unknown icon'],
    ])('should throw an invalid TileError when the tile has %s', (_case, change, message) => {
      // Given
      const tile = { ...validTile, ...change };

      // When / Then
      expect(() => validate(linkTileSchema, tile)).toThrow(
        expect.objectContaining({ name: 'TileError', code: 'invalid', message }),
      );
    });
  });
});
