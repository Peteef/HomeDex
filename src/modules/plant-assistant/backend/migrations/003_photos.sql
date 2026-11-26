-- At most one photo per plant. Replacing it inserts a new row, and AUTOINCREMENT never gives a
-- deleted id again, so the photo's URL (which carries its id) changes and caches load the new one.
CREATE TABLE plant_assistant_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL UNIQUE REFERENCES plant_assistant_plants (id) ON DELETE CASCADE,
  jpeg BLOB NOT NULL,
  created_at INTEGER NOT NULL
);
