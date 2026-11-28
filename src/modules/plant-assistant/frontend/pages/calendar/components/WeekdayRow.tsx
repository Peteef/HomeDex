import type { CalendarDay } from '../../../features/calendar/index.ts';
import type { CalendarFormat } from '../internal/calendarFormat.ts';

export interface WeekdayRowProps {
  week: CalendarDay[];
  format: CalendarFormat;
}

export const WeekdayRow = ({ week, format }: WeekdayRowProps) => (
  <thead>
    <tr>
      {week.map(({ date }) => (
        <th key={date} scope="col" className="text-dex-ink-muted pb-1 text-xs font-bold">
          <span aria-hidden>{format.weekdayShort(date)}</span>
          <span className="sr-only">{format.weekdayLong(date)}</span>
        </th>
      ))}
    </tr>
  </thead>
);
