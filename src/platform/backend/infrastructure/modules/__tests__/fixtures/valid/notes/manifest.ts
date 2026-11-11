import { defineModule } from '#platform/shared';

export default defineModule({
  id: 'notes',
  name: 'Notes',
  description: 'Short notes',
  icon: 'notes',
  route: '/m/notes',
  enabled: true,
});
