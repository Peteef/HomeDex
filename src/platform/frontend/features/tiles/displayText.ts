import { LANGUAGES, SOURCE_LANGUAGE } from '../../lib/i18n/index.ts';
import type { Language } from '../../lib/i18n/index.ts';
import { MODULE_TILE_TEXTS } from './internal/moduleTileTexts.ts';
import type { Tile, TileText, TileTexts } from './types.ts';

const textsOf = (tile: Tile): TileTexts =>
  tile.moduleId === null ? tile.texts : (MODULE_TILE_TEXTS[tile.moduleId] ?? {});

const anyText = (texts: TileTexts): TileText | undefined =>
  LANGUAGES.map(({ code }) => texts[code]).find((text) => text !== undefined);

const UNNAMED = 'UNNAMED';

const unnamed = (tile: Tile): TileText => ({
  title: tile.moduleId ?? UNNAMED,
  description: null,
});

export const displayText = (tile: Tile, language: Language): TileText => {
  const texts = textsOf(tile);
  return texts[language] ?? texts[SOURCE_LANGUAGE] ?? anyText(texts) ?? unnamed(tile);
};
