// Public API of the platform backend: the only thing modules may import (as #platform/backend).
export type { CurrentUser } from '../auth/index.ts';
export { currentUser } from '../auth/index.ts';
export type { Logger } from '../logger.ts';
export { logger } from '../logger.ts';
export type { Storage } from '../storage/index.ts';
