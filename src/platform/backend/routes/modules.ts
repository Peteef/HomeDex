import { Router } from 'express';
import { jsonBody } from '../infrastructure/http/jsonBody.ts';
import { moduleContext } from '../infrastructure/modules/moduleContext.ts';
import type { TileBadges } from '../infrastructure/modules/tileBadges.ts';
import type { LoadedModule } from '../infrastructure/modules/types.ts';
import type { Storage } from '../infrastructure/storage/index.ts';

export interface ModulesRoutesOptions {
  modules: LoadedModule[];
  storage: Storage;
  today: () => string;
  tileBadges: TileBadges;
}

const toSummary = ({ manifest }: LoadedModule) => ({
  id: manifest.id,
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
export const moduleApiRoutes = ({
  modules,
  storage,
  today,
  tileBadges,
}: ModulesRoutesOptions): Router => {
  const router = Router();

  for (const { manifest, register } of modules) {
    if (register !== null) {
      const ctx = moduleContext(manifest.id, storage, today, tileBadges);
      register(ctx);
      router.use(`/${manifest.id}`, jsonBody(manifest.requestBodyLimitKb), ctx.router);
    }
  }

  return router;
};
