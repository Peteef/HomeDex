import type { Language } from '../i18n/languages.ts';

export type TileKind = 'link' | 'module';

export const TILE_SCOPES = ['shared', 'personal'] as const;

export type TileScope = (typeof TILE_SCOPES)[number];

export interface TileText {
  title: string;
  description: string | null;
}

export type TileTexts = Partial<Record<Language, TileText>>;

// A tile as the API returns it.
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
  countOnBadge: number;
}
