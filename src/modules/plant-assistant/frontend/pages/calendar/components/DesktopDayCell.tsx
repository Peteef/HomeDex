import { UrgencyLabel } from '../../../components/urgency-label/UrgencyLabel.tsx';
import type { CalendarDay, CalendarPlant } from '../../../features/calendar/index.ts';
import { useText } from '../../../locales/index.ts';
import type { CalendarFormat } from '../internal/calendarFormat.ts';
import { DOT_CLASSES } from '../internal/urgencyStyles.ts';
import { DayLabel } from './DayLabel.tsx';

export interface DesktopDayCellProps {
  day: CalendarDay;
  selected: boolean;
  format: CalendarFormat;
  onSelect: (date: string) => void;
  onOpen: (plant: CalendarPlant) => void;
}

const NAMES_PER_DAY = 3;

const FOCUS_CLASSES =
  'focus-visible:outline-dex-ink focus-visible:outline-3 focus-visible:outline-offset-2';

const numberClasses = ({ inMonth, isToday }: CalendarDay, selected: boolean): string =>
  [
    `${FOCUS_CLASSES} flex size-11 items-center justify-center rounded-full text-base font-bold transition-colors`,
    inMonth ? 'text-dex-ink' : 'text-dex-ink-muted',
    selected ? 'bg-dex-surface' : 'hover:bg-dex-surface/60',
    isToday ? 'ring-dex-red ring-2 ring-inset' : '',
  ].join(' ');

export const DesktopDayCell = ({
  day,
  selected,
  format,
  onSelect,
  onOpen,
}: DesktopDayCellProps) => {
  const text = useText('calendar.monthGrid');
  const hiddenCount = day.plants.length - NAMES_PER_DAY;

  const select = (): void => {
    onSelect(day.date);
  };

  return (
    <td className="border-dex-line h-32 border p-1 align-top">
      <button
        type="button"
        aria-pressed={selected}
        onClick={select}
        className={numberClasses(day, selected)}
      >
        <span aria-hidden>{format.dayNumber(day.date)}</span>
        <DayLabel day={day} format={format} />
      </button>
      <ul className="flex flex-col">
        {day.plants.slice(0, NAMES_PER_DAY).map((plant) => (
          <li key={plant.id}>
            <button
              type="button"
              onClick={() => {
                onOpen(plant);
              }}
              className={`${FOCUS_CLASSES} hover:bg-dex-surface flex min-h-7 w-full items-center gap-1.5 rounded-md px-1 text-left text-xs font-bold`}
            >
              <span
                aria-hidden
                className={`size-2 shrink-0 rounded-full ${DOT_CLASSES[plant.urgency]}`}
              />
              <span className="truncate">{plant.name}</span>
              <span className="sr-only">
                {', '}
                <UrgencyLabel urgency={plant.urgency} daysUntil={plant.daysUntil} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={select}
          className={`${FOCUS_CLASSES} text-dex-ink-muted hover:text-dex-ink min-h-7 rounded-md px-1 text-xs font-bold underline underline-offset-2`}
        >
          {text.more({ count: hiddenCount })}
          <span className="sr-only">{text.moreOn({ date: format.fullDate(day.date) })}</span>
        </button>
      )}
    </td>
  );
};
