import type { Language } from '../../../shared/i18n/languages.ts';

export type TileKind = 'link' | 'module';
export const TILE_SCOPES = ['shared', 'personal'] as const;

export type TileScope = (typeof TILE_SCOPES)[number];
export type TileErrorCode = 'invalid' | 'not_found' | 'forbidden';

export interface TileText {
  title: string;
  description: string | null;
}

export type TileTexts = Partial<Record<Language, TileText>>;

export interface Tile {
  id: number;
  dexNo: number;
  kind: TileKind;
  texts: TileTexts;
  icon: string;
  url: string | null;
  moduleId: string | null;
  scope: TileScope;
  pinned: boolean;
  editable: boolean;
}

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
