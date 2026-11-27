import type { CalendarDay, CalendarPlant } from '../../../features/calendar/index.ts';
import { useText } from '../../../locales/index.ts';
import { DayPlantRow } from './DayPlantRow.tsx';

export interface DayPlantListProps {
  day: CalendarDay;
  onOpen: (plant: CalendarPlant) => void;
}

export const DayPlantList = ({ day, onOpen }: DayPlantListProps) => {
  const text = useText('calendar.dayPlants');

  return day.plants.length === 0 ? (
    <p className="text-dex-ink-muted py-2 text-base font-bold">{text.nothing}</p>
  ) : (
    <ul className="flex flex-col gap-2">
      {day.plants.map((plant) => (
        <DayPlantRow key={plant.id} plant={plant} onOpen={onOpen} />
      ))}
    </ul>
  );
};
