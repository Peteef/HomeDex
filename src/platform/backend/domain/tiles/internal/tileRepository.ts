import type { Storage } from '../../../infrastructure/storage/index.ts';
import type { Language } from '../../../../shared/i18n/languages.ts';
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

export interface UserTileRow extends TileRow {
  texts: TileTexts;
  pinned: 0 | 1;
  owner_archived: 0 | 1;
}

type UserTileQueryRow = Omit<UserTileRow, 'texts'>;

interface TileTextRow {
  tile_id: number;
  language: Language;
  title: string;
  description: string | null;
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
  pins.user_id IS NOT NULL AS pinned,
  COALESCE(owners.archived_at IS NOT NULL, 0) AS owner_archived`;

const USER_TILE_JOINS = `LEFT JOIN pins ON pins.tile_id = tiles.id AND pins.user_id = @userId
  LEFT JOIN users AS owners ON owners.id = tiles.owner_id`;

const VISIBLE_TO_USER = "(tiles.scope = 'shared' OR tiles.owner_id = @userId)";

const textsByTile = (rows: TileTextRow[]): Map<number, TileTexts> => {
  const texts = new Map<number, TileTexts>();

  for (const { tile_id, language, title, description } of rows) {
    texts.set(tile_id, { ...texts.get(tile_id), [language]: { title, description } });
  }

  return texts;
};

const withTexts = (row: UserTileQueryRow, texts: Map<number, TileTexts>): UserTileRow => ({
  ...row,
  texts: texts.get(row.id) ?? {},
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

  const selectTextsOf = db.prepare('SELECT * FROM tile_texts WHERE tile_id = ?');

  const selectTextsForUser = db.prepare(
    `SELECT tile_texts.* FROM tile_texts JOIN tiles ON tiles.id = tile_texts.tile_id
     WHERE ${VISIBLE_TO_USER}`,
  );

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

  const insertLinkWithTexts = (tile: LinkTileRecord, ownerId: number, now: number): number => {
    const { id } = insertLinkTile.get({ ...tile, ownerId, now }) as { id: number };
    insertTexts(id, tile.texts);
    return id;
  };

  const updateLinkWithTexts = (id: number, tile: LinkTileRecord, now: number): void => {
    updateLinkTile.run({ ...tile, id, now });
    deleteTexts.run(id);
    insertTexts(id, tile.texts);
  };

  const insertLink = (tile: LinkTileRecord, ownerId: number, now: number): number =>
    db.transaction(insertLinkWithTexts)(tile, ownerId, now);

  const findForUser = (id: number, userId: number): UserTileRow | undefined => {
    const row = selectForUser.get({ id, userId }) as UserTileQueryRow | undefined;
    return row && withTexts(row, textsByTile(selectTextsOf.all(id) as TileTextRow[]));
  };

  const listForUser = (userId: number): UserTileRow[] => {
    const texts = textsByTile(selectTextsForUser.all({ userId }) as TileTextRow[]);
    return (selectAllForUser.all({ userId }) as UserTileQueryRow[]).map((row) =>
      withTexts(row, texts),
    );
  };

  const updateLink = (id: number, tile: LinkTileRecord, now: number): void => {
    db.transaction(updateLinkWithTexts)(id, tile, now);
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
