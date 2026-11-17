import type { TileScope } from '../../../shared/tiles/tileTypes.ts';

export { TILE_SCOPES } from '../../../shared/tiles/tileTypes.ts';
export type {
  Tile,
  TileKind,
  TileScope,
  TileText,
  TileTexts,
} from '../../../shared/tiles/tileTypes.ts';

export type TileErrorCode = 'invalid' | 'not_found' | 'forbidden';

export interface EnabledModule {
  moduleId: string;
  icon: string;
}

export interface NewTileText {
  title: string;
  description?: string | null;
}

export type NewTileTexts = Partial<Record<string, NewTileText>>;

export interface NewLinkTile {
  texts: NewTileTexts;
  url: string;
  icon: string;
  scope: TileScope;
}

// `texts` replaces every language, so a language left out is removed.
export interface TileEdit {
  texts?: NewTileTexts;
  url?: string;
  icon?: string;
  scope?: TileScope;
}
