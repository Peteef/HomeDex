import type { Storage } from '../../infrastructure/storage/index.ts';
import { TileError } from './errors.ts';
import { pinRepository } from './internal/pinRepository.ts';
import { tileRepository } from './internal/tileRepository.ts';
import type { LinkTileRecord, UserTileRow } from './internal/tileRepository.ts';
import { toTile } from './internal/toTile.ts';
import { linkTileSchema, validate } from './internal/validation.ts';
import type { NewLinkTile, Tile, TileEdit, TileScope } from './types.ts';

interface TilesOptions {
  now?: () => number;
}

export interface TilesService {
  list(userId: number): Tile[];
  create(userId: number, tile: NewLinkTile): Tile;
  edit(userId: number, id: number, changes: TileEdit): Tile;
  remove(userId: number, id: number): void;
  pin(userId: number, id: number): void;
  unpin(userId: number, id: number): void;
}

type LinkTileRow = UserTileRow & { url: string };

const isLinkTile = (row: UserTileRow): row is LinkTileRow =>
  row.kind === 'link' && row.url !== null;

const isCreator = (row: UserTileRow, userId: number): boolean => row.owner_id === userId;

// Nobody could change a shared tile whose creator is archived, so anyone may.
const isOrphaned = (row: UserTileRow): boolean =>
  row.scope === 'shared' && row.owner_archived === 1;

const isEditable = (row: UserTileRow, userId: number): row is LinkTileRow =>
  isLinkTile(row) && (isCreator(row, userId) || isOrphaned(row));

const toLinkTileRecord = (row: LinkTileRow): LinkTileRecord => ({
  texts: row.texts,
  icon: row.icon,
  url: row.url,
  scope: row.scope,
});

export const tilesService = (db: Storage, { now = Date.now }: TilesOptions = {}): TilesService => {
  const tiles = tileRepository(db);
  const pins = pinRepository(db);

  const requireVisible = (userId: number, id: number): UserTileRow => {
    const row = tiles.findForUser(id, userId);

    if (!row) {
      throw new TileError('not_found', `No tile with id ${String(id)}`);
    }

    return row;
  };

  const requireEditable = (userId: number, id: number): LinkTileRow => {
    const row = requireVisible(userId, id);

    if (!isEditable(row, userId)) {
      throw new TileError('forbidden', 'Only the creator can change this tile');
    }

    return row;
  };

  // Scope changes go one way, so nobody hides a shared tile from the others by mistake.
  const requireStillShared = (row: UserTileRow, scope: TileScope): void => {
    if (row.scope === 'shared' && scope === 'personal') {
      throw new TileError('invalid', 'A shared tile cannot be made personal');
    }
  };

  const tileFor = (userId: number, id: number): Tile => {
    const row = requireVisible(userId, id);
    return toTile(row, isEditable(row, userId));
  };

  // Pinned first, then by Dex number. The UI sorts by title, since the title depends on the
  // language it shows.
  const list = (userId: number): Tile[] =>
    tiles.listForUser(userId).map((row) => toTile(row, isEditable(row, userId)));

  const create = (userId: number, tile: NewLinkTile): Tile => {
    const record = validate(linkTileSchema, tile);
    const id = tiles.insertLink(record, userId, now());
    return tileFor(userId, id);
  };

  const edit = (userId: number, id: number, changes: TileEdit): Tile => {
    const row = requireEditable(userId, id);
    const record = validate(linkTileSchema, { ...toLinkTileRecord(row), ...changes });
    requireStillShared(row, record.scope);
    tiles.updateLink(id, record, now());
    return tileFor(userId, id);
  };

  const remove = (userId: number, id: number): void => {
    requireEditable(userId, id);
    tiles.delete(id);
  };

  const pin = (userId: number, id: number): void => {
    requireVisible(userId, id);
    pins.pin(userId, id, now());
  };

  const unpin = (userId: number, id: number): void => {
    requireVisible(userId, id);
    pins.unpin(userId, id);
  };

  return {
    list,
    create,
    edit,
    remove,
    pin,
    unpin,
  };
};
