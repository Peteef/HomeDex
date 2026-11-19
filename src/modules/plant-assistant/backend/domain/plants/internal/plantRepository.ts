import type { Storage } from '#platform/backend';
import { foldText } from '#platform/shared';

export interface PlantRecord {
  name: string;
  description: string | null;
  tags: string[];
  summerIntervalDays: number;
  winterIntervalDays: number;
  lastWateredOn: string;
  nextWateringOn: string;
}

export interface StoredPlant extends PlantRecord {
  id: number;
}

export interface PlantRepository {
  list(): StoredPlant[];
  find(id: number): StoredPlant | undefined;
  insert(plant: PlantRecord): number;
  update(id: number, plant: PlantRecord): boolean;
  remove(id: number): boolean;
  tags(): string[];
}

interface PlantRow {
  id: number;
  name: string;
  description: string | null;
  summer_interval_days: number;
  winter_interval_days: number;
  last_watered_on: string;
  next_watering_on: string;
}

interface TagRow {
  plant_id: number;
  tag: string;
}

const COLUMNS =
  'id, name, description, summer_interval_days, winter_interval_days, last_watered_on, next_watering_on';

const toPlant = (row: PlantRow, tags: string[]): StoredPlant => ({
  id: row.id,
  name: row.name,
  description: row.description,
  tags,
  summerIntervalDays: row.summer_interval_days,
  winterIntervalDays: row.winter_interval_days,
  lastWateredOn: row.last_watered_on,
  nextWateringOn: row.next_watering_on,
});

export const plantRepository = (db: Storage): PlantRepository => {
  const selectAll = db.prepare<[], PlantRow>(
    `SELECT ${COLUMNS} FROM plant_assistant_plants ORDER BY id`,
  );

  const selectOne = db.prepare<[number], PlantRow>(
    `SELECT ${COLUMNS} FROM plant_assistant_plants WHERE id = ?`,
  );

  // Tags keep the order they were given in: the rowid grows with every insert.
  const selectAllTags = db.prepare<[], TagRow>(
    'SELECT plant_id, tag FROM plant_assistant_tags ORDER BY rowid',
  );

  const selectTagsOf = db.prepare<[number], TagRow>(
    'SELECT plant_id, tag FROM plant_assistant_tags WHERE plant_id = ? ORDER BY rowid',
  );

  const selectDistinctTags = db.prepare<[], { tag: string }>(
    `SELECT tag FROM plant_assistant_tags
     WHERE rowid IN (SELECT MIN(rowid) FROM plant_assistant_tags GROUP BY tag_key)
     ORDER BY tag_key`,
  );

  const insertPlant = db.prepare(
    `INSERT INTO plant_assistant_plants (name, description, summer_interval_days,
       winter_interval_days, last_watered_on, next_watering_on, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const updatePlant = db.prepare(
    `UPDATE plant_assistant_plants SET name = ?, description = ?, summer_interval_days = ?,
       winter_interval_days = ?, last_watered_on = ?, next_watering_on = ?, updated_at = ?
     WHERE id = ?`,
  );

  const deletePlant = db.prepare('DELETE FROM plant_assistant_plants WHERE id = ?');

  const insertTag = db.prepare(
    'INSERT INTO plant_assistant_tags (plant_id, tag, tag_key) VALUES (?, ?, ?)',
  );

  const deleteTagsOf = db.prepare('DELETE FROM plant_assistant_tags WHERE plant_id = ?');

  const tagsByPlant = (): Map<number, string[]> => {
    const byPlant = new Map<number, string[]>();

    selectAllTags.all().forEach(({ plant_id: plantId, tag }) => {
      byPlant.set(plantId, [...(byPlant.get(plantId) ?? []), tag]);
    });

    return byPlant;
  };

  const insertTags = (plantId: number, tags: string[]): void => {
    tags.forEach((tag) => {
      insertTag.run(plantId, tag, foldText(tag));
    });
  };

  const list = (): StoredPlant[] => {
    const tags = tagsByPlant();
    return selectAll.all().map((row) => toPlant(row, tags.get(row.id) ?? []));
  };

  const find = (id: number): StoredPlant | undefined => {
    const row = selectOne.get(id);
    return row === undefined
      ? undefined
      : toPlant(
          row,
          selectTagsOf.all(id).map(({ tag }) => tag),
        );
  };

  const insert = (plant: PlantRecord): number =>
    db.transaction(() => {
      const now = Date.now();

      const id = Number(
        insertPlant.run(
          plant.name,
          plant.description,
          plant.summerIntervalDays,
          plant.winterIntervalDays,
          plant.lastWateredOn,
          plant.nextWateringOn,
          now,
          now,
        ).lastInsertRowid,
      );

      insertTags(id, plant.tags);
      return id;
    })();

  const update = (id: number, plant: PlantRecord): boolean =>
    db.transaction(() => {
      const changed =
        updatePlant.run(
          plant.name,
          plant.description,
          plant.summerIntervalDays,
          plant.winterIntervalDays,
          plant.lastWateredOn,
          plant.nextWateringOn,
          Date.now(),
          id,
        ).changes > 0;

      if (changed) {
        deleteTagsOf.run(id);
        insertTags(id, plant.tags);
      }

      return changed;
    })();

  const remove = (id: number): boolean => deletePlant.run(id).changes > 0;

  const tags = (): string[] => selectDistinctTags.all().map(({ tag }) => tag);

  return {
    list,
    find,
    insert,
    update,
    remove,
    tags,
  };
};
