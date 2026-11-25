import type { Storage } from '#platform/backend';

export interface NewWateringEvent {
  plantId: number;
  wateredOn: string;
  accountId: number;
  username: string;
}

export interface StoredWateringEvent {
  id: number;
  plantId: number;
  wateredOn: string;
}

export interface WateringEventRepository {
  insert(watering: NewWateringEvent): number;
  find(plantId: number, id: number): StoredWateringEvent | undefined;
  newestOf(plantId: number): StoredWateringEvent | undefined;
  remove(id: number): void;
}

interface WateringEventRow {
  id: number;
  plant_id: number;
  watered_on: string;
}

const toWateringEvent = (row: WateringEventRow): StoredWateringEvent => ({
  id: row.id,
  plantId: row.plant_id,
  wateredOn: row.watered_on,
});

export const wateringEventRepository = (db: Storage): WateringEventRepository => {
  const insertEvent = db.prepare(
    `INSERT INTO plant_assistant_watering_events (plant_id, watered_on, account_id, username, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  );

  const selectOne = db.prepare<[number, number], WateringEventRow>(
    `SELECT id, plant_id, watered_on FROM plant_assistant_watering_events
     WHERE plant_id = ? AND id = ?`,
  );

  const selectNewest = db.prepare<[number], WateringEventRow>(
    `SELECT id, plant_id, watered_on FROM plant_assistant_watering_events
     WHERE plant_id = ? ORDER BY id DESC LIMIT 1`,
  );

  const deleteEvent = db.prepare('DELETE FROM plant_assistant_watering_events WHERE id = ?');

  const insert = ({ plantId, wateredOn, accountId, username }: NewWateringEvent): number =>
    Number(insertEvent.run(plantId, wateredOn, accountId, username, Date.now()).lastInsertRowid);

  const find = (plantId: number, id: number): StoredWateringEvent | undefined => {
    const row = selectOne.get(plantId, id);
    return row === undefined ? undefined : toWateringEvent(row);
  };

  const newestOf = (plantId: number): StoredWateringEvent | undefined => {
    const row = selectNewest.get(plantId);
    return row === undefined ? undefined : toWateringEvent(row);
  };

  const remove = (id: number): void => {
    deleteEvent.run(id);
  };

  return {
    insert,
    find,
    newestOf,
    remove,
  };
};
