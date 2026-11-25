import type { Storage } from '#platform/backend';

export interface NewWatering {
  plantId: number;
  wateredOn: string;
  accountId: number;
  username: string;
}

export interface StoredWatering {
  id: number;
  plantId: number;
  wateredOn: string;
}

export interface WateringRepository {
  insert(watering: NewWatering): number;
  find(plantId: number, id: number): StoredWatering | undefined;
  newestOf(plantId: number): StoredWatering | undefined;
  remove(id: number): void;
}

interface WateringRow {
  id: number;
  plant_id: number;
  watered_on: string;
}

const toWatering = (row: WateringRow): StoredWatering => ({
  id: row.id,
  plantId: row.plant_id,
  wateredOn: row.watered_on,
});

export const wateringRepository = (db: Storage): WateringRepository => {
  const insertWatering = db.prepare(
    `INSERT INTO plant_assistant_waterings (plant_id, watered_on, account_id, username, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  );

  const selectOne = db.prepare<[number, number], WateringRow>(
    `SELECT id, plant_id, watered_on FROM plant_assistant_waterings
     WHERE plant_id = ? AND id = ?`,
  );

  const selectNewest = db.prepare<[number], WateringRow>(
    `SELECT id, plant_id, watered_on FROM plant_assistant_waterings
     WHERE plant_id = ? ORDER BY id DESC LIMIT 1`,
  );

  const deleteWatering = db.prepare('DELETE FROM plant_assistant_waterings WHERE id = ?');

  const insert = ({ plantId, wateredOn, accountId, username }: NewWatering): number =>
    Number(insertWatering.run(plantId, wateredOn, accountId, username, Date.now()).lastInsertRowid);

  const find = (plantId: number, id: number): StoredWatering | undefined => {
    const row = selectOne.get(plantId, id);
    return row === undefined ? undefined : toWatering(row);
  };

  const newestOf = (plantId: number): StoredWatering | undefined => {
    const row = selectNewest.get(plantId);
    return row === undefined ? undefined : toWatering(row);
  };

  const remove = (id: number): void => {
    deleteWatering.run(id);
  };

  return {
    insert,
    find,
    newestOf,
    remove,
  };
};
