CREATE TABLE pins (
  user_id INTEGER NOT NULL REFERENCES users (id),
  tile_id INTEGER NOT NULL REFERENCES tiles (id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, tile_id)
);

CREATE INDEX pins_tile_id ON pins (tile_id);
