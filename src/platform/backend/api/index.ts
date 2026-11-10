// Public API of the platform backend: the only thing modules may import (as #platform/backend).
export type { CurrentUser } from '../auth/currentUser.ts';
export { currentUser } from '../auth/currentUser.ts';
export type { Logger } from '../logger.ts';
export { logger } from '../logger.ts';
export type { Storage } from '../storage/db.ts';
