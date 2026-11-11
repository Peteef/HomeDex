import { Router } from 'express';
import { moduleContext } from '../infrastructure/modules/moduleContext.ts';
import type { LoadedModule } from '../infrastructure/modules/types.ts';
import type { Storage } from '../infrastructure/storage/index.ts';

export interface ModulesRoutesOptions {
  modules: LoadedModule[];
  storage: Storage;
}

const toSummary = ({ manifest }: LoadedModule) => ({
  id: manifest.id,
  name: manifest.name,
  description: manifest.description ?? null,
  icon: manifest.icon,
  route: manifest.route,
});

export const modulesRoutes = ({ modules }: ModulesRoutesOptions): Router => {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({ modules: modules.map(toSummary) });
  });

  return router;
};

// Each module's own endpoints, under /api/m/<id>.
export const moduleApiRoutes = ({ modules, storage }: ModulesRoutesOptions): Router => {
  const router = Router();

  for (const { manifest, register } of modules) {
    if (register !== null) {
      const ctx = moduleContext(manifest.id, storage);
      register(ctx);
      router.use(`/${manifest.id}`, ctx.router);
    }
  }

  return router;
};
