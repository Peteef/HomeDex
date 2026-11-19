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
  // Each module parses bodies with its own limit, so it comes before the platform's parser.
  router.use('/m', deps.requireAuth, moduleApiRoutes(deps));
  router.use(jsonBody());
  router.use('/health', healthRoutes());
  router.use('/auth', authRoutes(deps));
  router.use('/tiles', deps.requireAuth, tilesRoutes(deps));
  router.use('/modules', deps.requireAuth, modulesRoutes(deps));
  return router;
};
