import { useTranslation } from 'react-i18next';
import type { CalendarDay, CalendarPlant } from '../../../features/calendar/index.ts';
import { calendarFormat } from '../internal/calendarFormat.ts';
import { DesktopDayCell } from './DesktopDayCell.tsx';
import { DesktopPastDayCell } from './DesktopPastDayCell.tsx';
import { WeekdayRow } from './WeekdayRow.tsx';

export interface DesktopMonthGridProps {
  weeks: CalendarDay[][];
  selected: string | null;
  onSelect: (date: string) => void;
  onOpen: (plant: CalendarPlant) => void;
}

export const DesktopMonthGrid = ({ weeks, selected, onSelect, onOpen }: DesktopMonthGridProps) => {
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
                  selected={day.date === selected}
                  format={format}
                  onSelect={onSelect}
                  onOpen={onOpen}
                />
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
