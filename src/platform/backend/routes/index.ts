import { Router } from 'express';
import { jsonBody } from '../infrastructure/http/jsonBody.ts';
import { authRoutes } from './auth.ts';
import type { AuthRoutesOptions } from './auth.ts';
import { healthRoutes } from './health.ts';
import { moduleApiRoutes, modulesRoutes } from './modules.ts';
import type { ModulesRoutesOptions } from './modules.ts';
import { tilesRoutes } from './tiles.ts';
import type { TilesRoutesOptions } from './tiles.ts';

// Every HTTP endpoint of the platform, mounted under the API path by the app.
export type RouteDependencies = AuthRoutesOptions & TilesRoutesOptions & ModulesRoutesOptions;

export const apiRoutes = (deps: RouteDependencies): Router => {
  const router = Router();
  // Order matters: the platform's parser below would refuse a module's larger body before the
  // module's own parser, with its own limit, could read it. So module routes come first.
  router.use('/m', deps.requireAuth, moduleApiRoutes(deps));
  router.use(jsonBody());
  router.use('/health', healthRoutes());
  router.use('/auth', authRoutes(deps));
  router.use('/tiles', deps.requireAuth, tilesRoutes(deps));
  router.use('/modules', deps.requireAuth, modulesRoutes(deps));
  return router;
};
