import { describe, expect, it } from 'vitest';
import { sortTiles } from '../sortTiles.ts';

const titles = (tiles: { title: string }[]) => tiles.map((tile) => tile.title);
const tile = (title: string) => ({ title });
const pinnedTitles =
  (...pinned: string[]) =>
  (candidate: { title: string }) =>
    pinned.includes(candidate.title);

describe('sortTiles', () => {
  it('should sort alphabetically when nothing is pinned', () => {
    // Given
    const tiles = [tile('Taxes'), tile('Finances'), tile('Mortgage')];

    // When
    const sorted = sortTiles(tiles, pinnedTitles());

    // Then
    expect(titles(sorted)).toEqual(['Finances', 'Mortgage', 'Taxes']);
  });

  it('should put pinned tiles first, each group alphabetical', () => {
    // Given
    const tiles = [tile('Taxes'), tile('Finances'), tile('Mortgage'), tile('Weight log')];

    // When
    const sorted = sortTiles(tiles, pinnedTitles('Weight log', 'Mortgage'));

    // Then
    expect(titles(sorted)).toEqual(['Mortgage', 'Weight log', 'Finances', 'Taxes']);
  });

  it('should ignore letter case when sorting', () => {
    // Given
    const tiles = [tile('banana'), tile('Apple'), tile('cherry')];

    // When
    const sorted = sortTiles(tiles, pinnedTitles());

    // Then
    expect(titles(sorted)).toEqual(['Apple', 'banana', 'cherry']);
  });

  it('should sort accented letters next to their base letter', () => {
    // Given
    const tiles = [tile('Zebra'), tile('Émile'), tile('Eagle')];

    // When
    const sorted = sortTiles(tiles, pinnedTitles());

    // Then
    expect(titles(sorted)).toEqual(['Eagle', 'Émile', 'Zebra']);
  });

  it('should not change the list it is given', () => {
    // Given
    const tiles = [tile('B'), tile('A')];

    // When
    sortTiles(tiles, pinnedTitles());

    // Then
    expect(titles(tiles)).toEqual(['B', 'A']);
  });

  it('should return an empty list when there are no tiles', () => {
    // When / Then
    expect(sortTiles([], pinnedTitles())).toEqual([]);
  });
});
