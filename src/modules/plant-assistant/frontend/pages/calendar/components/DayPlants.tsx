import { useTranslation } from 'react-i18next';
import { PlantThumbnail } from '../../../components/plant-thumbnail/PlantThumbnail.tsx';
import { UrgencyLabel } from '../../../components/urgency-label/UrgencyLabel.tsx';
import type { CalendarDay, CalendarPlant } from '../../../features/calendar/index.ts';
import { useText } from '../../../locales/index.ts';
import { calendarFormat } from '../internal/calendarFormat.ts';

export interface DayPlantsProps {
  day: CalendarDay;
  onOpen: (plant: CalendarPlant) => void;
}

const ROW_CLASSES =
  'bg-dex-surface/80 hover:bg-dex-surface focus-visible:outline-dex-ink flex min-h-11 w-full items-center gap-3 rounded-2xl p-2 pr-3 text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

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
            <li key={plant.id}>
              <button
                type="button"
                onClick={() => {
                  onOpen(plant);
                }}
                className={ROW_CLASSES}
              >
                <PlantThumbnail photoUrl={null} size="small" />
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
          ))}
        </ul>
      )}
    </div>
  );
};
