import type { Language } from '../../lib/i18n/index.ts';
import { displayText } from './displayText.ts';
import type { Tile } from './types.ts';

export const sortTiles = (tiles: readonly Tile[], language: Language): Tile[] => {
  const collator = new Intl.Collator(language, { sensitivity: 'base' });
  const titleOf = (tile: Tile): string => displayText(tile, language).title;

  const pinnedFirstThenByTitle = (a: Tile, b: Tile): number =>
    Number(b.pinned) - Number(a.pinned) ||
    collator.compare(titleOf(a), titleOf(b)) ||
    a.dexNo - b.dexNo;

  return [...tiles].sort(pinnedFirstThenByTitle);
};
