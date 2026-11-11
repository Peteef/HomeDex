import type { Tile, TileTexts } from '../index.ts';

export const linkTile = (texts: TileTexts, changes: Partial<Tile> = {}): Tile => ({
  id: 1,
  dexNo: 1,
  kind: 'link',
  texts,
  icon: 'wallet',
  url: 'https://docs.example.com/budget',
  moduleId: null,
  scope: 'shared',
  pinned: false,
  editable: true,
  ...changes,
});

export const moduleTile = (moduleId: string, changes: Partial<Tile> = {}): Tile => ({
  ...linkTile({}),
  kind: 'module',
  url: null,
  moduleId,
  editable: false,
  ...changes,
});
