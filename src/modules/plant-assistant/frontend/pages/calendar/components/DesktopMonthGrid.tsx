import { useTranslation } from 'react-i18next';
import type { CalendarDay, CalendarPlant } from '../../../features/calendar/index.ts';
import { calendarFormat } from '../internal/calendarFormat.ts';
import { DesktopDayCell } from './DesktopDayCell.tsx';
import { DesktopPastDayCell } from './DesktopPastDayCell.tsx';
import { WeekdayRow } from './WeekdayRow.tsx';

export interface DesktopMonthGridProps {
  weeks: CalendarDay[][];
  onOpen: (plant: CalendarPlant) => void;
  onShowDay: (date: string) => void;
}

export const DesktopMonthGrid = ({ weeks, onOpen, onShowDay }: DesktopMonthGridProps) => {
  const { i18n } = useTranslation();
  const format = calendarFormat(i18n.language);
  const [firstWeek = []] = weeks;

  return (
    <table className="w-full table-fixed border-collapse">
      <WeekdayRow week={firstWeek} format={format} />
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0]?.date}>
            {week.map((day) =>
              day.isPast ? (
                <DesktopPastDayCell key={day.date} day={day} format={format} />
              ) : (
                <DesktopDayCell
                  key={day.date}
                  day={day}
                  format={format}
                  onOpen={onOpen}
                  onShowDay={onShowDay}
                />
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
