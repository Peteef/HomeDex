import type { Request, Router } from 'express';
import type { ModuleManifest } from '../../../shared/manifest/manifestSchema.ts';
import type { CurrentUser } from '../../domain/auth/index.ts';
import type { Logger } from '../logger.ts';
import type { Storage } from '../storage/index.ts';

export interface ModuleContext {
  id: string;
  // Mounted at /api/m/<id>, behind the login.
  router: Router;
  storage: Storage;
  currentUser: (req: Request) => CurrentUser;
  logger: Logger;
}

export type RegisterModule = (ctx: ModuleContext) => void;

export interface LoadedModule {
  manifest: ModuleManifest;
  register: RegisterModule | null;
  migrationsDir: string | null;
}
