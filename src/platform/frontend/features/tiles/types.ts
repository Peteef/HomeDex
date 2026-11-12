import type { Language } from '../../lib/i18n/index.ts';

export interface TileText {
  title: string;
  description: string | null;
}

export type TileTexts = Partial<Record<Language, TileText>>;

export interface Tile {
  id: number;
  dexNo: number;
  kind: 'link' | 'module';
  texts: TileTexts;
  icon: string;
  url: string | null;
  moduleId: string | null;
  scope: 'shared' | 'personal';
  pinned: boolean;
  editable: boolean;
}

export interface PinChange {
  id: number;
  pinned: boolean;
}
