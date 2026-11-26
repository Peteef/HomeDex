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
  photoId: number | null;
}

export interface PlantDates {
  lastWateredOn: string;
  nextWateringOn: string;
}

export interface PlantRepository {
  list(): StoredPlant[];
  find(id: number): StoredPlant | undefined;
  insert(plant: PlantRecord): number;
  update(id: number, plant: PlantRecord): void;
  setDates(id: number, dates: PlantDates): void;
  remove(id: number): void;
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
  photo_id: number | null;
  tags: string;
}

// One row per plant: its tags come as a JSON array, in the order they were given (the rowid
// grows with every insert), and a plant without tags gets an empty one. A plant has at most one
// photo, so joining it adds no rows.
const SELECT_PLANTS = `
  SELECT p.id, p.name, p.description, p.summer_interval_days, p.winter_interval_days,
    p.last_watered_on, p.next_watering_on, ph.id AS photo_id,
    json_group_array(t.tag ORDER BY t.rowid) FILTER (WHERE t.tag IS NOT NULL) AS tags
  FROM plant_assistant_plants p
  LEFT JOIN plant_assistant_photos ph ON ph.plant_id = p.id
  LEFT JOIN plant_assistant_tags t ON t.plant_id = p.id`;

const toPlant = (row: PlantRow): StoredPlant => ({
  id: row.id,
  name: row.name,
  description: row.description,
  tags: JSON.parse(row.tags) as string[],
  summerIntervalDays: row.summer_interval_days,
  winterIntervalDays: row.winter_interval_days,
  lastWateredOn: row.last_watered_on,
  nextWateringOn: row.next_watering_on,
  photoId: row.photo_id,
});

export const plantRepository = (db: Storage): PlantRepository => {
  const selectAll = db.prepare<[], PlantRow>(`${SELECT_PLANTS} GROUP BY p.id ORDER BY p.id`);

  const selectOne = db.prepare<[number], PlantRow>(`${SELECT_PLANTS} WHERE p.id = ? GROUP BY p.id`);

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

  const updateDates = db.prepare(
    `UPDATE plant_assistant_plants SET last_watered_on = ?, next_watering_on = ?, updated_at = ?
     WHERE id = ?`,
  );

  const deletePlant = db.prepare('DELETE FROM plant_assistant_plants WHERE id = ?');

  const insertTag = db.prepare(
    'INSERT INTO plant_assistant_tags (plant_id, tag, tag_key) VALUES (?, ?, ?)',
  );

  const deleteTagsOf = db.prepare('DELETE FROM plant_assistant_tags WHERE plant_id = ?');

  const insertTags = (plantId: number, tags: string[]): void => {
    tags.forEach((tag) => {
      insertTag.run(plantId, tag, foldText(tag));
    });
  };

  const list = (): StoredPlant[] => selectAll.all().map(toPlant);

  const find = (id: number): StoredPlant | undefined => {
    const row = selectOne.get(id);
    return row === undefined ? undefined : toPlant(row);
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

  const update = (id: number, plant: PlantRecord): void => {
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
    })();
  };

  const setDates = (id: number, { lastWateredOn, nextWateringOn }: PlantDates): void => {
    updateDates.run(lastWateredOn, nextWateringOn, Date.now(), id);
  };

  const remove = (id: number): void => {
    deletePlant.run(id);
  };

  const tags = (): string[] => selectDistinctTags.all().map(({ tag }) => tag);

  return {
    list,
    find,
    insert,
    update,
    setDates,
    remove,
    tags,
  };
};
