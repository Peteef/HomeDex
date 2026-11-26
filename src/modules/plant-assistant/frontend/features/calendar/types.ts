import type { Urgency } from '../../components/urgency-label/UrgencyLabel.tsx';

export interface CalendarPlant {
  id: number;
  name: string;
  photoId: number | null;
  urgency: Urgency;
  daysUntil: number;
}

export interface CalendarDay {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  plants: CalendarPlant[];
}

export interface CalendarMonth {
  today: string;
  month: string;
  weeks: CalendarDay[][];
}
