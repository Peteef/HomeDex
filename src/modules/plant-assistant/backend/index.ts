import type { RegisterModule } from '#platform/backend';
import { plantsService } from './domain/plants/index.ts';
import { plantsRoutes } from './routes/plants.ts';
import { tagsRoutes } from './routes/tags.ts';

export const register: RegisterModule = ({ router, storage, today }) => {
  const plants = plantsService(storage, { today });
  router.use(plantsRoutes({ plants }));
  router.use(tagsRoutes({ plants }));
};
