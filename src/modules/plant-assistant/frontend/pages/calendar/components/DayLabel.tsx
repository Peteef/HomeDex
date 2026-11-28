import type { CalendarDay } from '../../../features/calendar/index.ts';
import { useText } from '../../../locales/index.ts';
import type { CalendarFormat } from '../internal/calendarFormat.ts';

export interface DayLabelProps {
  day: CalendarDay;
  format: CalendarFormat;
}

// What a screen reader says for a day: the grid shows only its number and a marker.
export const DayLabel = ({ day, format }: DayLabelProps) => {
  const text = useText('calendar.monthGrid');
  const count = day.plants.length;

  return (
    <span className="sr-only">
      {[
        format.fullDate(day.date),
        ...(day.isToday ? [text.today] : []),
        ...(count > 0 ? [text.plants({ count })] : []),
      ].join(', ')}
    </span>
  );
};
