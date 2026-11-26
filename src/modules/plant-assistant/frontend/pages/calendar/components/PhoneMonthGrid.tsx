import { useTranslation } from 'react-i18next';
import type { CalendarDay } from '../../../features/calendar/index.ts';
import { calendarFormat } from '../internal/calendarFormat.ts';
import type { CalendarFormat } from '../internal/calendarFormat.ts';
import { MARKER_CLASSES } from '../internal/urgencyStyles.ts';
import { DayLabel } from './DayLabel.tsx';
import { WeekdayRow } from './WeekdayRow.tsx';

export interface PhoneMonthGridProps {
  weeks: CalendarDay[][];
  selected: string | null;
  onSelect: (date: string) => void;
}

interface DayCellProps {
  day: CalendarDay;
  selected: boolean;
  format: CalendarFormat;
  onSelect: (date: string) => void;
}

const DAY_CLASSES =
  'focus-visible:outline-dex-ink flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

const dayClasses = ({ inMonth, isToday }: CalendarDay, selected: boolean): string =>
  [
    DAY_CLASSES,
    inMonth ? 'text-dex-ink' : 'text-dex-ink-muted',
    selected ? 'bg-dex-surface' : 'hover:bg-dex-surface/60',
    isToday ? 'ring-dex-red ring-2 ring-inset' : '',
  ].join(' ');

const DayCell = ({ day, selected, format, onSelect }: DayCellProps) => {
  const select = (): void => {
    onSelect(day.date);
  };

  const [mostUrgent] = day.plants;

  if (day.isPast) {
    return (
      <td className="p-0">
        <span className="text-dex-ink-muted flex min-h-11 items-center justify-center text-sm">
          <span aria-hidden>{format.dayNumber(day.date)}</span>
          <DayLabel day={day} format={format} />
        </span>
      </td>
    );
  }

  return (
    <td className="p-0">
      <button
        type="button"
        aria-pressed={selected}
        onClick={select}
        className={dayClasses(day, selected)}
      >
        <span aria-hidden>{format.dayNumber(day.date)}</span>
        {mostUrgent === undefined ? null : (
          <span
            aria-hidden
            className={`min-w-5 rounded-full px-1 text-xs leading-4 font-extrabold ${MARKER_CLASSES[mostUrgent.urgency]}`}
          >
            {day.plants.length}
          </span>
        )}
        <DayLabel day={day} format={format} />
      </button>
    </td>
  );
};

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
            {week.map((day) => (
              <DayCell
                key={day.date}
                day={day}
                selected={day.date === selected}
                format={format}
                onSelect={onSelect}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
