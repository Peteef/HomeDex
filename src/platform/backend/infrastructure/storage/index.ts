export type { Storage } from './db.ts';
export { openDatabase } from './db.ts';
export { runMigrations } from './migrator.ts';
export { migratePlatform, openStorage, PLATFORM_SCOPE } from './openStorage.ts';
