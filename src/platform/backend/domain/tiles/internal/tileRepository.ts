import type { Storage } from '../../../infrastructure/storage/index.ts';
import type { TileKind, TileScope, TileText, TileTexts } from '../types.ts';

interface TileRow {
  id: number;
  dex_no: number;
  kind: TileKind;
  icon: string;
  url: string | null;
  module_id: string | null;
  scope: TileScope;
  owner_id: number | null;
  created_at: number;
  updated_at: number;
}

// A tile as one user sees it, with its texts as a JSON object keyed by language, that user's pin
// and whether its creator is archived.
interface UserTileQueryRow extends TileRow {
  texts: string;
  pinned: 0 | 1;
  owner_archived: 0 | 1;
}

export interface UserTileRow extends Omit<UserTileQueryRow, 'texts'> {
  texts: TileTexts;
}

export interface LinkTileRecord {
  texts: TileTexts;
  icon: string;
  url: string;
  scope: TileScope;
}

export interface TileRepository {
  insertLink(tile: LinkTileRecord, ownerId: number, now: number): number;
  findForUser(id: number, userId: number): UserTileRow | undefined;
  listForUser(userId: number): UserTileRow[];
  updateLink(id: number, tile: LinkTileRecord, now: number): void;
  delete(id: number): void;
}

const USER_TILE_COLUMNS = `tiles.*,
  (SELECT json_group_object(language, json_object('title', title, 'description', description))
     FROM tile_texts WHERE tile_texts.tile_id = tiles.id) AS texts,
  pins.user_id IS NOT NULL AS pinned,
  COALESCE(owners.archived_at IS NOT NULL, 0) AS owner_archived`;

const USER_TILE_JOINS = `LEFT JOIN pins ON pins.tile_id = tiles.id AND pins.user_id = @userId
  LEFT JOIN users AS owners ON owners.id = tiles.owner_id`;

const VISIBLE_TO_USER = "(tiles.scope = 'shared' OR tiles.owner_id = @userId)";

const parseTexts = (row: UserTileQueryRow): UserTileRow => ({
  ...row,
  texts: JSON.parse(row.texts) as TileTexts,
});

export const tileRepository = (db: Storage): TileRepository => {
  const insertLinkTile = db.prepare(
    `INSERT INTO tiles (dex_no, kind, icon, url, scope, owner_id, created_at, updated_at)
     VALUES ((SELECT COALESCE(MAX(dex_no), 0) + 1 FROM tiles), 'link',
       @icon, @url, @scope, @ownerId, @now, @now)
     RETURNING id`,
  );

  const insertText = db.prepare(
    `INSERT INTO tile_texts (tile_id, language, title, description)
     VALUES (@tileId, @language, @title, @description)`,
  );

  const deleteTexts = db.prepare('DELETE FROM tile_texts WHERE tile_id = ?');

  const selectForUser = db.prepare(
    `SELECT ${USER_TILE_COLUMNS} FROM tiles ${USER_TILE_JOINS}
     WHERE tiles.id = @id AND ${VISIBLE_TO_USER}`,
  );

  const selectAllForUser = db.prepare(
    `SELECT ${USER_TILE_COLUMNS} FROM tiles ${USER_TILE_JOINS} WHERE ${VISIBLE_TO_USER}
     ORDER BY pinned DESC, tiles.dex_no`,
  );

  const updateLinkTile = db.prepare(
    `UPDATE tiles SET icon = @icon, url = @url, scope = @scope, updated_at = @now
     WHERE id = @id AND kind = 'link'`,
  );

  const deleteTile = db.prepare('DELETE FROM tiles WHERE id = ?');

  const insertTexts = (tileId: number, texts: TileTexts): void => {
    for (const [language, text] of Object.entries<TileText>(texts)) {
      insertText.run({ tileId, language, ...text });
    }
  };

  const insertLink = (tile: LinkTileRecord, ownerId: number, now: number): number =>
    db.transaction(() => {
      const { id } = insertLinkTile.get({ ...tile, ownerId, now }) as { id: number };
      insertTexts(id, tile.texts);
      return id;
    })();

  const findForUser = (id: number, userId: number): UserTileRow | undefined => {
    const row = selectForUser.get({ id, userId }) as UserTileQueryRow | undefined;
    return row && parseTexts(row);
  };

  const listForUser = (userId: number): UserTileRow[] =>
    (selectAllForUser.all({ userId }) as UserTileQueryRow[]).map(parseTexts);

  const updateLink = (id: number, tile: LinkTileRecord, now: number): void => {
    db.transaction(() => {
      updateLinkTile.run({ ...tile, id, now });
      deleteTexts.run(id);
      insertTexts(id, tile.texts);
    })();
  };

  const remove = (id: number): void => {
    deleteTile.run(id);
  };

  return {
    insertLink,
    findForUser,
    listForUser,
    updateLink,
    delete: remove,
  };
};
