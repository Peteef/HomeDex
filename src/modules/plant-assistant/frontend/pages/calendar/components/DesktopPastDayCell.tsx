import type { CalendarDay } from '../../../features/calendar/index.ts';
import type { CalendarFormat } from '../internal/calendarFormat.ts';
import { DayLabel } from './DayLabel.tsx';

export interface DesktopPastDayCellProps {
  day: CalendarDay;
  format: CalendarFormat;
}

export const DesktopPastDayCell = ({ day, format }: DesktopPastDayCellProps) => (
  <td className="border-dex-line h-32 border p-1 align-top">
    <span className="text-dex-ink-muted flex size-11 items-center justify-center text-base">
      <span aria-hidden>{format.dayNumber(day.date)}</span>
      <DayLabel day={day} format={format} />
    </span>
  </td>
);
