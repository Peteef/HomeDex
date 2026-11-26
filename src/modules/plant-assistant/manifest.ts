import { defineModule } from '#platform/shared';

export default defineModule({
  id: 'plant-assistant',
  icon: 'plant',
  route: '/m/plant-assistant',
  enabled: true,
  // A photo of up to 1536 kB grows by a third in base64, next to the plant's other fields.
  requestBodyLimitKb: 2560,
});
