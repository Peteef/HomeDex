import type { RegisterModule } from '#platform/backend';
import { itemsService } from './domain/items/index.ts';
import { itemsRoutes } from './routes/items.ts';

export const register: RegisterModule = ({ router, storage, currentUser }) => {
  router.use(itemsRoutes({ items: itemsService(storage), currentUser }));
};
