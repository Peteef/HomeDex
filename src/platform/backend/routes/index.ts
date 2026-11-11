import { Router } from 'express';
import { authRoutes } from './auth.ts';
import type { AuthRoutesOptions } from './auth.ts';
import { healthRoutes } from './health.ts';
import { tilesRoutes } from './tiles.ts';
import type { TilesRoutesOptions } from './tiles.ts';

// Every HTTP endpoint of the platform, mounted under the API path by the app.
export type RouteDependencies = AuthRoutesOptions & TilesRoutesOptions;

export const apiRoutes = (deps: RouteDependencies): Router => {
  const router = Router();
  router.use('/health', healthRoutes());
  router.use('/auth', authRoutes(deps));
  router.use('/tiles', deps.requireAuth, tilesRoutes(deps));
  return router;
};
