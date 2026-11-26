import { getJson } from '#platform/frontend';
import type { CalendarMonth } from '../types.ts';

const CALENDAR_PATH = '/m/plant-assistant/calendar';

// Without a month the server answers today's month, so the browser never needs to know today.
export const fetchCalendarMonth = (month: string | null): Promise<CalendarMonth> =>
  getJson<CalendarMonth>(
    month === null
      ? CALENDAR_PATH
      : `${CALENDAR_PATH}?${new URLSearchParams({ month }).toString()}`,
  );
