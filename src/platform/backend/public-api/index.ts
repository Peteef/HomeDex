// Public API of the platform backend: what a module's backend may import (as #platform/backend).
export type { CurrentUser } from '../domain/auth/index.ts';
export { currentUser } from '../infrastructure/http/auth/currentUser.ts';
export type { Logger } from '../infrastructure/logger.ts';
export { logger } from '../infrastructure/logger.ts';
export type { ModuleContext, RegisterModule } from '../infrastructure/modules/types.ts';
export type { Storage } from '../infrastructure/storage/index.ts';
