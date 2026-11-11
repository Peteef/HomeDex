CREATE TABLE book_shelf_books (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS book_shelf_loans (
  book_id INTEGER NOT NULL REFERENCES book_shelf_books (id)
);
