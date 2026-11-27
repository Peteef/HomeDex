import { useTranslation } from 'react-i18next';
import type { CalendarDay, CalendarPlant } from '../../../features/calendar/index.ts';
import { calendarFormat } from '../internal/calendarFormat.ts';
import { DayPlantList } from './DayPlantList.tsx';

export interface DayPlantsProps {
  day: CalendarDay;
  onOpen: (plant: CalendarPlant) => void;
}

export const DayPlants = ({ day, onOpen }: DayPlantsProps) => {
  const { i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-lg font-extrabold first-letter:uppercase">
        {calendarFormat(i18n.language).fullDate(day.date)}
      </h4>
      <DayPlantList day={day} onOpen={onOpen} />
    </div>
  );
};
