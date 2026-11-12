import { describe, expect, it, vi } from 'vitest';
import { displayText, sortTiles } from '../index.ts';
import type { Tile } from '../index.ts';
import { linkTile, moduleTile } from './tiles.ts';

vi.mock('../../modules/index.ts', () => ({
  MODULE_TRANSLATIONS: [
    { namespace: 'shopping-list', language: 'en', messages: { manifest: { name: 'Shopping' } } },
    { namespace: 'shopping-list', language: 'pl', messages: { manifest: { name: 'Zakupy' } } },
  ],
}));

const tile = (dexNo: number, en: string, pl?: string, pinned = false): Tile =>
  linkTile(
    pl === undefined
      ? { en: { title: en, description: null } }
      : { en: { title: en, description: null }, pl: { title: pl, description: null } },
    { id: dexNo, dexNo, pinned },
  );

const titles = (tiles: Tile[], language: 'en' | 'pl'): string[] =>
  sortTiles(tiles, language).map((sorted) => displayText(sorted, language).title);

describe('sortTiles', () => {
  it('should sort pinned tiles first, then by title ignoring case and accents', () => {
    // Given
    const tiles = [
      tile(1, 'banana'),
      tile(2, 'Éclair'),
      tile(3, 'Cherry', undefined, true),
      tile(4, 'apple'),
      tile(5, 'Zucchini', undefined, true),
    ];

    // When / Then
    expect(titles(tiles, 'en')).toEqual(['Cherry', 'Zucchini', 'apple', 'banana', 'Éclair']);
  });

  it('should sort by the title shown in the current language', () => {
    // Given
    const tiles = [
      tile(1, 'Budget', 'Budżet'),
      tile(2, 'Car', 'Auto'),
      moduleTile('shopping-list'),
    ];

    // When / Then
    expect(titles(tiles, 'en')).toEqual(['Budget', 'Car', 'Shopping']);
    expect(titles(tiles, 'pl')).toEqual(['Auto', 'Budżet', 'Zakupy']);
  });

  it('should follow the alphabet of the language', () => {
    // Given
    const tiles = [tile(1, 'Zdrowie'), tile(2, 'Łódka'), tile(3, 'Lody'), tile(4, 'Mapa')];

    // When / Then
    expect(titles(tiles, 'pl')).toEqual(['Lody', 'Łódka', 'Mapa', 'Zdrowie']);
  });

  it('should order tiles with the same title by Dex number', () => {
    // Given
    const tiles = [tile(2, 'notes'), tile(1, 'Notes')];

    // When / Then
    expect(sortTiles(tiles, 'en').map(({ dexNo }) => dexNo)).toEqual([1, 2]);
  });

  it('should leave the given list as it is', () => {
    // Given
    const tiles = [tile(2, 'b'), tile(1, 'a')];

    // When
    sortTiles(tiles, 'en');

    // Then
    expect(tiles.map(({ dexNo }) => dexNo)).toEqual([2, 1]);
  });
});
