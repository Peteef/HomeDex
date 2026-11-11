CREATE TABLE tiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dex_no INTEGER NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('link', 'module')),
  icon TEXT NOT NULL,
  url TEXT,
  module_id TEXT UNIQUE,
  scope TEXT NOT NULL CHECK (scope IN ('shared', 'personal')),
  owner_id INTEGER REFERENCES users (id),
  platforms TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (
    (kind = 'link' AND url IS NOT NULL AND module_id IS NULL AND owner_id IS NOT NULL)
    OR (kind = 'module' AND module_id IS NOT NULL AND url IS NULL)
  ),
  CHECK (scope = 'shared' OR owner_id IS NOT NULL)
);

CREATE INDEX tiles_owner_id ON tiles (owner_id);

-- The title and description of a link tile, one row per language the user wrote them in. Module
-- tiles have none: their text comes from the module's locale files.
CREATE TABLE tile_texts (
  tile_id INTEGER NOT NULL REFERENCES tiles (id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (tile_id, language)
);
