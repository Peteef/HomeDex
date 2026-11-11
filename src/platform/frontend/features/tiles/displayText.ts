import { LANGUAGES, SOURCE_LANGUAGE } from '../../lib/i18n/index.ts';
import type { Language } from '../../lib/i18n/index.ts';
import { MODULE_TILE_TEXTS } from './internal/moduleTileTexts.ts';
import type { Tile, TileText, TileTexts } from './types.ts';

const textsOf = (tile: Tile): TileTexts =>
  tile.moduleId === null ? tile.texts : (MODULE_TILE_TEXTS[tile.moduleId] ?? {});

const anyText = (texts: TileTexts): TileText | undefined =>
  LANGUAGES.map(({ code }) => texts[code]).find((text) => text !== undefined);

// The API never sends a link tile without text, so only a module without locale files gets here.
const fallbackText = (tile: Tile): TileText => ({
  title: tile.moduleId ?? '',
  description: null,
});

// The one rule for which text a tile shows: the current language, else the source language, else
// any language the tile has. Title and description always come from the same language.
export const displayText = (tile: Tile, language: Language): TileText => {
  const texts = textsOf(tile);
  return texts[language] ?? texts[SOURCE_LANGUAGE] ?? anyText(texts) ?? fallbackText(tile);
};
