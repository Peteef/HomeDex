import type { Tile } from '../types.ts';
import type { UserTileRow } from './tileRepository.ts';

interface UserView {
  editable: boolean;
  badge: number | null;
}

export const toTile = (row: UserTileRow, { editable, badge }: UserView): Tile => ({
  id: row.id,
  dexNo: row.dex_no,
  kind: row.kind,
  texts: row.texts,
  icon: row.icon,
  url: row.url,
  moduleId: row.module_id,
  scope: row.scope,
  pinned: row.pinned === 1,
  editable,
  badge,
});
