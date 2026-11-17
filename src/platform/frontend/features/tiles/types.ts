import type { TileScope, TileTexts } from '../../../shared/tiles/tileTypes.ts';

export type { Tile, TileScope, TileText, TileTexts } from '../../../shared/tiles/tileTypes.ts';

export interface PinChange {
  id: number;
  pinned: boolean;
}

export interface TileDraft {
  texts: TileTexts;
  url: string;
  icon: string;
  scope: TileScope;
}

export interface TileUpdate {
  id: number;
  draft: TileDraft;
}
