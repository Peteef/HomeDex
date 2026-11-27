import type { RegisterModule } from '#platform/backend';
import { calendarService } from './domain/calendar/index.ts';
import { plantsService } from './domain/plants/index.ts';
import { wateringService } from './domain/watering/index.ts';
import { calendarRoutes } from './routes/calendar.ts';
import { plantsRoutes } from './routes/plants.ts';
import { tagsRoutes } from './routes/tags.ts';
import { wateringRoutes } from './routes/watering.ts';

export const register: RegisterModule = ({ router, storage, today, currentUser, setTileBadge }) => {
  const plants = plantsService(storage, { today });
  setTileBadge(() => plants.countDue());
  router.use(plantsRoutes({ plants }));
  router.use(tagsRoutes({ plants }));
  router.use(calendarRoutes({ calendar: calendarService(storage, { today }) }));
  router.use(wateringRoutes({ watering: wateringService(storage, { today }), currentUser }));
};
