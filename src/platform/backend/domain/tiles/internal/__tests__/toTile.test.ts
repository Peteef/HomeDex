import { describe, expect, it } from 'vitest';
import { toTile } from '../toTile.ts';
import type { UserTileRow } from '../tileRepository.ts';

const row: UserTileRow = {
  id: 3,
  dex_no: 12,
  kind: 'module',
  texts: { en: { title: 'Notes', description: null } },
  icon: 'notes',
  url: null,
  module_id: 'notes',
  scope: 'shared',
  owner_id: 1,
  created_at: 1_000,
  updated_at: 2_000,
  pinned: 1,
  owner_archived: 0,
};

describe('toTile', () => {
  it('should map the row to a tile without owner and timestamps when given a pinned row', () => {
    // When
    const tile = toTile(row, { editable: true, countOnBadge: 4 });

    // Then
    expect(tile).toEqual({
      id: 3,
      dexNo: 12,
      kind: 'module',
      texts: { en: { title: 'Notes', description: null } },
      icon: 'notes',
      url: null,
      moduleId: 'notes',
      scope: 'shared',
      pinned: true,
      editable: true,
      countOnBadge: 4,
    });
  });

  it('should map pinned and editable to false when the row is not pinned and not editable', () => {
    // When
    const tile = toTile({ ...row, pinned: 0 }, { editable: false, countOnBadge: 0 });

    // Then
    expect(tile.pinned).toBe(false);
    expect(tile.editable).toBe(false);
    expect(tile.countOnBadge).toBe(0);
  });
});
