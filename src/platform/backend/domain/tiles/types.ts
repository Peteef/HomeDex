export type TileKind = 'link' | 'module';
export const TILE_SCOPES = ['shared', 'personal'] as const;

export type TileScope = (typeof TILE_SCOPES)[number];
export type TileErrorCode = 'invalid' | 'not_found' | 'forbidden';

export interface Tile {
  id: number;
  dexNo: number;
  kind: TileKind;
  title: string;
  description: string | null;
  icon: string;
  url: string | null;
  moduleId: string | null;
  scope: TileScope;
  pinned: boolean;
  editable: boolean;
}

export interface NewLinkTile {
  title: string;
  url: string;
  icon: string;
  scope: TileScope;
  description?: string | null;
}

export interface TileEdit {
  title?: string;
  url?: string;
  icon?: string;
  scope?: TileScope;
  description?: string | null;
}
