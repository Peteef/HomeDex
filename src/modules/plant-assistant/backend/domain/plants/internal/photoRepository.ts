import type { Storage } from '#platform/backend';

export interface StoredPhoto {
  id: number;
  jpeg: Buffer;
}

export interface PhotoRepository {
  find(plantId: number): StoredPhoto | undefined;
  replace(plantId: number, jpeg: Buffer): number;
  remove(plantId: number): void;
}

export const photoRepository = (db: Storage): PhotoRepository => {
  const selectPhoto = db.prepare<[number], StoredPhoto>(
    'SELECT id, jpeg FROM plant_assistant_photos WHERE plant_id = ?',
  );

  const insertPhoto = db.prepare(
    'INSERT INTO plant_assistant_photos (plant_id, jpeg, created_at) VALUES (?, ?, ?)',
  );

  const deletePhoto = db.prepare('DELETE FROM plant_assistant_photos WHERE plant_id = ?');

  const find = (plantId: number): StoredPhoto | undefined => selectPhoto.get(plantId);

  const replace = (plantId: number, jpeg: Buffer): number =>
    db.transaction(() => {
      deletePhoto.run(plantId);
      return Number(insertPhoto.run(plantId, jpeg, Date.now()).lastInsertRowid);
    })();

  const remove = (plantId: number): void => {
    deletePhoto.run(plantId);
  };

  return {
    find,
    replace,
    remove,
  };
};
