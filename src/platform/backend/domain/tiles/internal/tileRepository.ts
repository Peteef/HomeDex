import type { Storage } from '../../../infrastructure/storage/index.ts';
import type { TileKind, TileScope } from '../types.ts';

export interface TileRow {
  id: number;
  dex_no: number;
  kind: TileKind;
  title: string;
  description: string | null;
  icon: string;
  url: string | null;
  module_id: string | null;
  scope: TileScope;
  owner_id: number | null;
  created_at: number;
  updated_at: number;
}

// A tile as one user sees it, with that user's pin and whether its creator is archived.
export interface UserTileRow extends TileRow {
  pinned: 0 | 1;
  owner_archived: 0 | 1;
}

export interface LinkTileRecord {
  title: string;
  description: string | null;
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
  pins.user_id IS NOT NULL AS pinned,
  COALESCE(owners.archived_at IS NOT NULL, 0) AS owner_archived`;

const USER_TILE_JOINS = `LEFT JOIN pins ON pins.tile_id = tiles.id AND pins.user_id = @userId
  LEFT JOIN users AS owners ON owners.id = tiles.owner_id`;

const VISIBLE_TO_USER = "(tiles.scope = 'shared' OR tiles.owner_id = @userId)";

export const tileRepository = (db: Storage): TileRepository => {
  const insertLinkTile = db.prepare(
    `INSERT INTO tiles (dex_no, kind, title, description, icon, url, scope, owner_id, created_at, updated_at)
     VALUES ((SELECT COALESCE(MAX(dex_no), 0) + 1 FROM tiles), 'link',
       @title, @description, @icon, @url, @scope, @ownerId, @now, @now)
     RETURNING id`,
  );

  const selectForUser = db.prepare(
    `SELECT ${USER_TILE_COLUMNS} FROM tiles ${USER_TILE_JOINS}
     WHERE tiles.id = @id AND ${VISIBLE_TO_USER}`,
  );

  const selectAllForUser = db.prepare(
    `SELECT ${USER_TILE_COLUMNS} FROM tiles ${USER_TILE_JOINS} WHERE ${VISIBLE_TO_USER}`,
  );

  const updateLinkTile = db.prepare(
    `UPDATE tiles SET title = @title, description = @description, icon = @icon, url = @url,
       scope = @scope, updated_at = @now
     WHERE id = @id AND kind = 'link'`,
  );

  const deleteTile = db.prepare('DELETE FROM tiles WHERE id = ?');

  const insertLink = (tile: LinkTileRecord, ownerId: number, now: number): number =>
    (insertLinkTile.get({ ...tile, ownerId, now }) as { id: number }).id;

  const findForUser = (id: number, userId: number): UserTileRow | undefined =>
    selectForUser.get({ id, userId }) as UserTileRow | undefined;

  const listForUser = (userId: number): UserTileRow[] =>
    selectAllForUser.all({ userId }) as UserTileRow[];

  const updateLink = (id: number, tile: LinkTileRecord, now: number): void => {
    updateLinkTile.run({ ...tile, id, now });
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
