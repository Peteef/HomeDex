import { UrgencyLabel } from '../../../components/urgency-label/UrgencyLabel.tsx';
import type { CalendarPlant } from '../../../features/calendar/index.ts';

export interface DayPlantRowProps {
  plant: CalendarPlant;
  onOpen: (plant: CalendarPlant) => void;
}

const ROW_CLASSES =
  'bg-dex-surface/80 hover:bg-dex-surface focus-visible:outline-dex-ink flex min-h-11 w-full items-center gap-3 rounded-2xl p-2 pr-3 text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

export const DayPlantRow = ({ plant, onOpen }: DayPlantRowProps) => {
  const open = (): void => {
    onOpen(plant);
  };

  return (
    <li>
      <button type="button" onClick={open} className={ROW_CLASSES}>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="text-dex-ink max-w-full text-base font-bold break-words">
            {plant.name}
          </span>
          <span className="shrink-0">
            <UrgencyLabel urgency={plant.urgency} daysUntil={plant.daysUntil} />
          </span>
        </span>
      </button>
    </li>
  );
};
