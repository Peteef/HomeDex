import { Router } from 'express';
import { authRoutes } from './auth.ts';
import type { AuthRoutesOptions } from './auth.ts';
import { healthRoutes } from './health.ts';

// Every HTTP endpoint of the platform, mounted under the API path by the app.
export type RouteDependencies = AuthRoutesOptions;

export function apiRoutes(deps: RouteDependencies): Router {
  const router = Router();
  router.use('/health', healthRoutes());
  router.use('/auth', authRoutes(deps));
  return router;
}
