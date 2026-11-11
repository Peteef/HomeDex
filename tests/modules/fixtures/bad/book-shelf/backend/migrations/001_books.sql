CREATE TABLE books (
  id INTEGER PRIMARY KEY
);

create table if not exists "book_shelf_loans" (
  book_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shelf_notes (
  text TEXT NOT NULL
);
