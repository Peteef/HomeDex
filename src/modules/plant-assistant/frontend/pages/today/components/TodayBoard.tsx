import type { PlantSummary } from '../../../features/plants/index.ts';
import { TodayPlantCard } from './TodayPlantCard.tsx';

export interface TodayBoardProps {
  plants: PlantSummary[];
  onOpen: (plant: PlantSummary) => void;
  onWater: (plant: PlantSummary) => void;
  onPostpone: (plant: PlantSummary) => void;
}

export const TodayBoard = ({ plants, onOpen, onWater, onPostpone }: TodayBoardProps) => (
  <ul className="flex flex-col gap-2">
    {plants.map((plant) => (
      <TodayPlantCard
        key={plant.id}
        plant={plant}
        onOpen={onOpen}
        onWater={onWater}
        onPostpone={onPostpone}
      />
    ))}
  </ul>
);
