import type { PlantSummary } from '../../../features/plants/index.ts';
import { PlantRow } from './PlantRow.tsx';

export interface PlantListProps {
  plants: PlantSummary[];
  onOpen: (plant: PlantSummary) => void;
  onSelectTag: (tag: string) => void;
}

export const PlantList = ({ plants, onOpen, onSelectTag }: PlantListProps) => (
  <ul className="flex flex-col gap-2">
    {plants.map((plant) => (
      <PlantRow key={plant.id} plant={plant} onOpen={onOpen} onSelectTag={onSelectTag} />
    ))}
  </ul>
);
