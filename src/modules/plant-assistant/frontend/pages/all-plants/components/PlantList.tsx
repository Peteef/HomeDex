import { PlantThumbnail } from '../../../components/plant-thumbnail/PlantThumbnail.tsx';
import { TagChip } from '../../../components/tag-chip/TagChip.tsx';
import { UrgencyLabel } from '../../../components/urgency-label/UrgencyLabel.tsx';
import type { PlantSummary } from '../../../features/plants/index.ts';

export interface PlantListProps {
  plants: PlantSummary[];
  onOpen: (plant: PlantSummary) => void;
}

interface PlantRowProps {
  plant: PlantSummary;
  onOpen: (plant: PlantSummary) => void;
}

const ROW_CLASSES =
  'bg-dex-surface/80 hover:bg-dex-surface focus-visible:outline-dex-ink flex min-h-11 w-full items-center gap-3 rounded-2xl p-2 pr-3 text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

const PlantRow = ({ plant, onOpen }: PlantRowProps) => {
  const open = () => {
    onOpen(plant);
  };

  return (
    <li>
      <button type="button" onClick={open} className={ROW_CLASSES}>
        <PlantThumbnail photoUrl={null} size="small" />
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="flex max-w-full min-w-0 flex-col items-start gap-1">
            <span className="text-dex-ink max-w-full text-base font-bold break-words">
              {plant.name}
            </span>
            {plant.tags.length > 0 && (
              <span className="flex flex-wrap gap-1">
                {plant.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </span>
            )}
          </span>
          <span className="shrink-0">
            <UrgencyLabel urgency={plant.urgency} daysUntil={plant.daysUntil} />
          </span>
        </span>
      </button>
    </li>
  );
};

export const PlantList = ({ plants, onOpen }: PlantListProps) => (
  <ul className="flex flex-col gap-2">
    {plants.map((plant) => (
      <PlantRow key={plant.id} plant={plant} onOpen={onOpen} />
    ))}
  </ul>
);
