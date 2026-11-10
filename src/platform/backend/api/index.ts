// Public API of the platform backend: the only thing modules may import (as #platform/backend).
export type { CurrentUser } from '../domain/auth/index.ts';
export { currentUser } from '../infrastructure/http/auth/currentUser.ts';
export type { Logger } from '../infrastructure/logger.ts';
export { logger } from '../infrastructure/logger.ts';
export type { Storage } from '../infrastructure/storage/index.ts';
