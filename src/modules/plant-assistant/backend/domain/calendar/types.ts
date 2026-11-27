import type { Urgency } from '../schedule/index.ts';

export interface CalendarPlant {
  id: number;
  name: string;
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

export type CalendarErrorCode = 'invalid';
