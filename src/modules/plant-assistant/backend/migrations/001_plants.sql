-- Dates are calendar days as YYYY-MM-DD text; created_at and updated_at are Unix milliseconds.
CREATE TABLE plant_assistant_plants (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  summer_interval_days INTEGER NOT NULL CHECK (summer_interval_days BETWEEN 1 AND 365),
  winter_interval_days INTEGER NOT NULL CHECK (winter_interval_days BETWEEN 1 AND 365),
  last_watered_on TEXT NOT NULL,
  next_watering_on TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX plant_assistant_plants_next_watering_on ON plant_assistant_plants (next_watering_on);

-- tag keeps the spelling as typed; tag_key is its folded form, so "Salon" and "salon" are one tag.
CREATE TABLE plant_assistant_tags (
  plant_id INTEGER NOT NULL REFERENCES plant_assistant_plants (id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  tag_key TEXT NOT NULL,
  UNIQUE (plant_id, tag_key)
);
