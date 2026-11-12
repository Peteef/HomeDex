-- added_by keeps the username at the time of adding: a module reads no platform tables.
CREATE TABLE shopping_list_items (
  id INTEGER PRIMARY KEY,
  text TEXT NOT NULL,
  amount TEXT,
  added_by TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0 CHECK (checked IN (0, 1))
);
