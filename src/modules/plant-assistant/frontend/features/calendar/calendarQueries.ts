import { MODULE_QUERY_KEY, useLiveQuery } from '../plants/index.ts';
import { fetchCalendarMonth } from './internal/calendarApi.ts';

export const useCalendarMonth = (month: string | null) =>
  useLiveQuery({
    queryKey: [...MODULE_QUERY_KEY, 'calendar', month],
    queryFn: () => fetchCalendarMonth(month),
    keepPrevious: true,
  });
