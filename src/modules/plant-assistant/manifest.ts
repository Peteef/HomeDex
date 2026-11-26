import { defineModule } from '#platform/shared';

export default defineModule({
  id: 'plant-assistant',
  icon: 'plant',
  route: '/m/plant-assistant',
  enabled: true,
  requestBodyLimitKb: 1024,
});
