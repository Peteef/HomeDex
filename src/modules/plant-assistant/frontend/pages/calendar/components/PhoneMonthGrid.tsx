import { useTranslation } from 'react-i18next';
import type { CalendarDay } from '../../../features/calendar/index.ts';
import { calendarFormat } from '../internal/calendarFormat.ts';
import { PhoneDayCell } from './PhoneDayCell.tsx';
import { PhonePastDayCell } from './PhonePastDayCell.tsx';
import { WeekdayRow } from './WeekdayRow.tsx';

export interface PhoneMonthGridProps {
  weeks: CalendarDay[][];
  selected: string | null;
  onSelect: (date: string) => void;
}

export const PhoneMonthGrid = ({ weeks, selected, onSelect }: PhoneMonthGridProps) => {
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
                <PhonePastDayCell key={day.date} day={day} format={format} />
              ) : (
                <PhoneDayCell
                  key={day.date}
                  day={day}
                  selected={day.date === selected}
                  format={format}
                  onSelect={onSelect}
                />
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
