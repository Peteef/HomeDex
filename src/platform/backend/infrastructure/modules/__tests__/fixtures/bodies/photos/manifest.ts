import { defineModule } from '#platform/shared';

export default defineModule({
  id: 'photos',
  icon: 'camera',
  route: '/m/photos',
  enabled: true,
  requestBodyLimitKb: 1024,
});
