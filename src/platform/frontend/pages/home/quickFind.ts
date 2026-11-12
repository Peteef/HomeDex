import { displayText } from '../../features/tiles/index.ts';
import type { Tile, TileText } from '../../features/tiles/index.ts';
import type { Language } from '../../lib/i18n/index.ts';
import { foldText } from '../../lib/search/index.ts';

const TITLE_PREFIX = 4;
const WORD_PREFIX = 3;
const TITLE_SUBSTRING = 2;
const DESCRIPTION_MATCH = 1;
const NO_MATCH = 0;

const WORD = /[\p{L}\p{N}]+/gu;
const WHITESPACE = /\s+/g;

const foldQuery = (query: string): string => foldText(query.trim().replace(WHITESPACE, ' '));

export const isBlankQuery = (query: string): boolean => foldQuery(query) === '';

const startsAtAWord = (title: string, query: string): boolean =>
  [...title.matchAll(WORD)].some(({ index }) => title.startsWith(query, index));

const scoreOf = ({ title, description }: TileText, query: string): number => {
  const foldedTitle = foldText(title);

  if (foldedTitle.startsWith(query)) {
    return TITLE_PREFIX;
  }

  if (startsAtAWord(foldedTitle, query)) {
    return WORD_PREFIX;
  }

  if (foldedTitle.includes(query)) {
    return TITLE_SUBSTRING;
  }

  return description !== null && foldText(description).includes(query)
    ? DESCRIPTION_MATCH
    : NO_MATCH;
};

// Ties keep the order the tiles came in, so pinned tiles stay ahead of equal matches.
export const findTiles = (tiles: readonly Tile[], query: string, language: Language): Tile[] => {
  const folded = foldQuery(query);

  if (folded === '') {
    return [...tiles];
  }

  const scored = (tile: Tile) => ({
    tile,
    score: scoreOf(displayText(tile, language), folded),
  });

  return tiles
    .map(scored)
    .filter(({ score }) => score > NO_MATCH)
    .sort((a, b) => b.score - a.score)
    .map(({ tile }) => tile);
};
