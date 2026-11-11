import type { Language } from '../../lib/i18n/index.ts';

export interface TileText {
  title: string;
  description: string | null;
}

// Only the languages the text exists in.
export type TileTexts = Partial<Record<Language, TileText>>;

// A tile as GET /api/tiles returns it. Module tiles come without texts: theirs live in the
// module's locale files.
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
