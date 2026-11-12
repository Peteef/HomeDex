import { describe, expect, it } from 'vitest';
import { linkTile } from '../../../../__tests__/tiles.ts';
import type { Tile } from '../../../../features/tiles/index.ts';
import { findTiles, isBlankQuery } from '../quickFind.ts';

let nextId = 1;

const tile = (title: string, description: string | null = null, polish?: string): Tile => {
  const id = nextId++;

  return linkTile(
    {
      en: { title, description },
      ...(polish === undefined ? {} : { pl: { title: polish, description: null } }),
    },
    { id, dexNo: id },
  );
};

const titles = (tiles: Tile[]): (string | undefined)[] => tiles.map(({ texts }) => texts.en?.title);

describe('quickFind', () => {
  describe('findTiles', () => {
    it('should rank a title prefix over a word prefix, a title substring and a description match', () => {
      // Given
      const tiles = [
        tile('Notes', 'Plans for the garden'),
        tile('Monthly plans'),
        tile('Explanation'),
        tile('Planner'),
      ];

      // When
      const found = findTiles(tiles, 'plan', 'en');

      // Then
      expect(titles(found)).toEqual(['Planner', 'Monthly plans', 'Explanation', 'Notes']);
    });

    it('should keep the incoming order when two tiles score the same', () => {
      // Given
      const tiles = [tile('Taxes 2026'), tile('Taxes 2025')];

      // When
      const found = findTiles(tiles, 'tax', 'en');

      // Then
      expect(titles(found)).toEqual(['Taxes 2026', 'Taxes 2025']);
    });

    it('should leave out tiles that match nothing', () => {
      // Given
      const tiles = [tile('Finances'), tile('Weight log')];

      // When
      const found = findTiles(tiles, 'weight', 'en');

      // Then
      expect(titles(found)).toEqual(['Weight log']);
    });

    it('should ignore case, diacritics and extra spaces in the query', () => {
      // Given
      const tiles = [tile('Shopping', null, 'Lista zakupów'), tile('Łódź trip', null, 'Wyjazd')];

      // When
      const shopping = findTiles(tiles, '  ZAKUPOW ', 'pl');
      const trip = findTiles(tiles, 'lodz   trip', 'en');

      // Then
      expect(titles(shopping)).toEqual(['Shopping']);
      expect(titles(trip)).toEqual(['Łódź trip']);
    });

    it('should search the text shown in the current language', () => {
      // Given
      const tiles = [tile('Shopping list', null, 'Lista zakupów')];

      // When
      const inPolish = findTiles(tiles, 'shopping', 'pl');
      const inEnglish = findTiles(tiles, 'shopping', 'en');

      // Then
      expect(inPolish).toEqual([]);
      expect(titles(inEnglish)).toEqual(['Shopping list']);
    });

    it('should match a query of several words only where they appear together', () => {
      // Given
      const tiles = [tile('Shopping list'), tile('List of shops')];

      // When
      const found = findTiles(tiles, 'shopping li', 'en');

      // Then
      expect(titles(found)).toEqual(['Shopping list']);
    });

    it('should return every tile in the incoming order when the query is blank', () => {
      // Given
      const tiles = [tile('Weight log'), tile('Finances')];

      // When
      const found = findTiles(tiles, '   ', 'en');

      // Then
      expect(titles(found)).toEqual(['Weight log', 'Finances']);
    });
  });

  describe('isBlankQuery', () => {
    it.each([
      ['', true],
      ['   ', true],
      [' a ', false],
    ])('should tell whether %j is blank', (query, expected) => {
      // When / Then
      expect(isBlankQuery(query)).toBe(expected);
    });
  });
});
