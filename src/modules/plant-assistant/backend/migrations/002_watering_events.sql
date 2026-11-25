-- Analytics only: no schedule is computed from it. account_id and username are copied from the
-- current user with no foreign key, because a module reads no platform tables.
CREATE TABLE plant_assistant_watering_events (
  id INTEGER PRIMARY KEY,
  plant_id INTEGER NOT NULL REFERENCES plant_assistant_plants (id) ON DELETE CASCADE,
  watered_on TEXT NOT NULL,
  account_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX plant_assistant_watering_events_plant_id ON plant_assistant_watering_events (plant_id);
