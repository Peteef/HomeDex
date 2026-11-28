import type { CalendarDay } from '../../../features/calendar/index.ts';
import type { CalendarFormat } from '../internal/calendarFormat.ts';
import { MARKER_CLASSES } from '../internal/urgencyStyles.ts';
import { DayLabel } from './DayLabel.tsx';

export interface PhoneDayCellProps {
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

export const PhoneDayCell = ({ day, selected, format, onSelect }: PhoneDayCellProps) => {
  const select = (): void => {
    onSelect(day.date);
  };

  const [mostUrgent] = day.plants;

  return (
    <td className="p-0">
      <button
        type="button"
        aria-pressed={selected}
        onClick={select}
        className={dayClasses(day, selected)}
      >
        <span aria-hidden>{format.dayNumber(day.date)}</span>
        {mostUrgent !== undefined && (
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
