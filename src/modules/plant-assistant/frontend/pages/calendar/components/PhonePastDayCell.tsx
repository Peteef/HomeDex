import type { CalendarDay } from '../../../features/calendar/index.ts';
import type { CalendarFormat } from '../internal/calendarFormat.ts';
import { DayLabel } from './DayLabel.tsx';

export interface PhonePastDayCellProps {
  day: CalendarDay;
  format: CalendarFormat;
}

export const PhonePastDayCell = ({ day, format }: PhonePastDayCellProps) => (
  <td className="p-0">
    <span className="text-dex-ink-muted flex min-h-11 items-center justify-center text-sm">
      <span aria-hidden>{format.dayNumber(day.date)}</span>
      <DayLabel day={day} format={format} />
    </span>
  </td>
);
