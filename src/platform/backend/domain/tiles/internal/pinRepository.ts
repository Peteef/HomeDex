import type { Storage } from '../../../infrastructure/storage/index.ts';

export interface PinRepository {
  pin(userId: number, tileId: number, now: number): void;
  unpin(userId: number, tileId: number): void;
  unpinAllExcept(tileId: number, userId: number): void;
}

export const pinRepository = (db: Storage): PinRepository => {
  const insertPin = db.prepare(
    'INSERT OR IGNORE INTO pins (user_id, tile_id, created_at) VALUES (?, ?, ?)',
  );

  const deletePin = db.prepare('DELETE FROM pins WHERE user_id = ? AND tile_id = ?');
  const deleteOtherPins = db.prepare('DELETE FROM pins WHERE tile_id = ? AND user_id <> ?');

  const pin = (userId: number, tileId: number, now: number): void => {
    insertPin.run(userId, tileId, now);
  };

  const unpin = (userId: number, tileId: number): void => {
    deletePin.run(userId, tileId);
  };

  const unpinAllExcept = (tileId: number, userId: number): void => {
    deleteOtherPins.run(tileId, userId);
  };

  return {
    pin,
    unpin,
    unpinAllExcept,
  };
};
