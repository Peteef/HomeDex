import type { Storage } from '../../../infrastructure/storage/index.ts';

export interface PinRepository {
  pin(userId: number, tileId: number, now: number): void;
  unpin(userId: number, tileId: number): void;
}

export const pinRepository = (db: Storage): PinRepository => {
  const insertPin = db.prepare(
    'INSERT OR IGNORE INTO pins (user_id, tile_id, created_at) VALUES (?, ?, ?)',
  );

  const deletePin = db.prepare('DELETE FROM pins WHERE user_id = ? AND tile_id = ?');

  const pin = (userId: number, tileId: number, now: number): void => {
    insertPin.run(userId, tileId, now);
  };

  const unpin = (userId: number, tileId: number): void => {
    deletePin.run(userId, tileId);
  };

  return {
    pin,
    unpin,
  };
};
