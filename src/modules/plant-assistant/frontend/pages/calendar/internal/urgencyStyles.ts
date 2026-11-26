import type { CalendarPlant } from '../../../features/calendar/index.ts';

type Urgency = CalendarPlant['urgency'];

export const MARKER_CLASSES: Record<Urgency, string> = {
  overdue: 'bg-dex-red-soft text-dex-red-text',
  today: 'bg-dex-amber-soft text-dex-amber-text',
  soon: 'bg-dex-amber-soft text-dex-amber-text',
  later: 'bg-dex-green-soft text-dex-green-text',
};

export const DOT_CLASSES: Record<Urgency, string> = {
  overdue: 'bg-dex-red-text',
  today: 'bg-dex-amber-text',
  soon: 'bg-dex-amber-text',
  later: 'bg-dex-green-text',
};
