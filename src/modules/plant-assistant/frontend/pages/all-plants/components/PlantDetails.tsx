import { Button } from '#platform/frontend';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PlantThumbnail } from '../../../components/plant-thumbnail/PlantThumbnail.tsx';
import { SelectableTagChip } from '../../../components/tag-chip/SelectableTagChip.tsx';
import { UrgencyLabel } from '../../../components/urgency-label/UrgencyLabel.tsx';
import type { PlantDetails as Plant, Season } from '../../../features/plants/index.ts';
import { useText } from '../../../locales/index.ts';

export interface PlantDetailsProps {
  plant: Plant;
  onEdit: () => void;
  onDelete: () => void;
  onSelectTag: (tag: string) => void;
}

// A calendar date parses as midnight UTC, so it is formatted in UTC to stay on the same day.
const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
};

const DAILY_INTERVAL_DAYS = 1;

const TERM_CLASSES = 'text-dex-ink-muted text-sm font-bold';
const VALUE_CLASSES = 'flex flex-wrap items-center gap-2 text-base font-bold';

export const PlantDetails = ({ plant, onEdit, onDelete, onSelectTag }: PlantDetailsProps) => {
  const text = useText('allPlants.plantDetails');
  const { i18n } = useTranslation();
  const dateFormat = new Intl.DateTimeFormat(i18n.language, DATE_FORMAT);

  const formatDate = (date: string): string => dateFormat.format(new Date(date));

  const interval = (season: Season, days: number) => (
    <>
      <dt className={TERM_CLASSES}>{text[season]}</dt>
      <dd className={VALUE_CLASSES}>
        {days === DAILY_INTERVAL_DAYS ? text.everyDay : text.every({ count: days })}
        {plant.currentSeason === season && (
          <span className="bg-dex-green-soft text-dex-green-text rounded-full px-2 py-0.5 text-sm font-extrabold">
            {text.now}
          </span>
        )}
      </dd>
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      <PlantThumbnail photoUrl={null} size="large" />
      {plant.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {plant.tags.map((tag) => (
            <SelectableTagChip key={tag} tag={tag} onSelect={onSelectTag} />
          ))}
        </div>
      )}
      {plant.description !== null && (
        <p className="text-base break-words whitespace-pre-line">{plant.description}</p>
      )}
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        {interval('summer', plant.summerIntervalDays)}
        {interval('winter', plant.winterIntervalDays)}
        <dt className={TERM_CLASSES}>{text.lastWatered}</dt>
        <dd className={VALUE_CLASSES}>{formatDate(plant.lastWateredOn)}</dd>
        <dt className={TERM_CLASSES}>{text.nextWatering}</dt>
        <dd className={VALUE_CLASSES}>
          {formatDate(plant.nextWateringOn)}
          <UrgencyLabel urgency={plant.urgency} daysUntil={plant.daysUntil} />
        </dd>
      </dl>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onEdit}>
          <Pencil size={18} aria-hidden />
          {text.edit}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onDelete}>
          <Trash2 size={18} aria-hidden />
          {text.delete}
        </Button>
      </div>
    </div>
  );
};
