import { useTranslation } from 'react-i18next';
import type { CalendarDay, CalendarPlant } from '../../../features/calendar/index.ts';
import { useText } from '../../../locales/index.ts';
import { calendarFormat } from '../internal/calendarFormat.ts';
import { DayPlantRow } from './DayPlantRow.tsx';

export interface DayPlantsProps {
  day: CalendarDay;
  onOpen: (plant: CalendarPlant) => void;
}

export const DayPlants = ({ day, onOpen }: DayPlantsProps) => {
  const text = useText('calendar.dayPlants');
  const { i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-lg font-extrabold first-letter:uppercase">
        {calendarFormat(i18n.language).fullDate(day.date)}
      </h4>
      {day.plants.length === 0 ? (
        <p className="text-dex-ink-muted py-2 text-base font-bold">{text.nothing}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {day.plants.map((plant) => (
            <DayPlantRow key={plant.id} plant={plant} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </div>
  );
};
