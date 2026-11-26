import { PlantThumbnail } from '../../../components/plant-thumbnail/PlantThumbnail.tsx';
import { SelectableTagChip } from '../../../components/tag-chip/SelectableTagChip.tsx';
import { UrgencyLabel } from '../../../components/urgency-label/UrgencyLabel.tsx';
import { photoUrl } from '../../../features/plants/index.ts';
import type { PlantSummary } from '../../../features/plants/index.ts';

export interface PlantListProps {
  plants: PlantSummary[];
  onOpen: (plant: PlantSummary) => void;
  onSelectTag: (tag: string) => void;
}

interface PlantRowProps {
  plant: PlantSummary;
  onOpen: (plant: PlantSummary) => void;
  onSelectTag: (tag: string) => void;
}

const ROW_CLASSES =
  'hover:bg-dex-surface focus-visible:outline-dex-ink flex min-h-11 w-full items-center gap-3 rounded-2xl p-2 pr-3 text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

// The tags are buttons of their own, so they sit beside the row's button, lined up under the name.
const PlantRow = ({ plant, onOpen, onSelectTag }: PlantRowProps) => {
  const open = () => {
    onOpen(plant);
  };

  return (
    <li className="bg-dex-surface/80 rounded-2xl">
      <button type="button" onClick={open} className={ROW_CLASSES}>
        <PlantThumbnail photoUrl={photoUrl(plant)} size="small" />
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="text-dex-ink max-w-full text-base font-bold break-words">
            {plant.name}
          </span>
          <span className="shrink-0">
            <UrgencyLabel urgency={plant.urgency} daysUntil={plant.daysUntil} />
          </span>
        </span>
      </button>
      {plant.tags.length > 0 && (
        <ul className="-mt-2 flex flex-wrap gap-x-1 pr-3 pl-17">
          {plant.tags.map((tag) => (
            <li key={tag} className="max-w-full">
              <SelectableTagChip tag={tag} onSelect={onSelectTag} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export const PlantList = ({ plants, onOpen, onSelectTag }: PlantListProps) => (
  <ul className="flex flex-col gap-2">
    {plants.map((plant) => (
      <PlantRow key={plant.id} plant={plant} onOpen={onOpen} onSelectTag={onSelectTag} />
    ))}
  </ul>
);
