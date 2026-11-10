import Database from 'better-sqlite3';

const BUSY_TIMEOUT_MS = 5000;

// The part of the database handle that modules may use.
export type Storage = Pick<Database.Database, 'prepare' | 'exec' | 'transaction'>;

export const openDatabase = (file: string): Database.Database => {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma(`busy_timeout = ${String(BUSY_TIMEOUT_MS)}`);
  return db;
};
