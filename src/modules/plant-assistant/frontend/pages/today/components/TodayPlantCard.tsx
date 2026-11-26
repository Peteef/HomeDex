import { Button } from '#platform/frontend';
import { Droplets } from 'lucide-react';
import { PlantThumbnail } from '../../../components/plant-thumbnail/PlantThumbnail.tsx';
import { UrgencyLabel } from '../../../components/urgency-label/UrgencyLabel.tsx';
import type { PlantSummary } from '../../../features/plants/index.ts';
import { useText } from '../../../locales/index.ts';

export interface TodayPlantCardProps {
  plant: PlantSummary;
  onOpen: (plant: PlantSummary) => void;
  onWater: (plant: PlantSummary) => void;
  onPostpone: (plant: PlantSummary) => void;
}

export const TodayPlantCard = ({ plant, onOpen, onWater, onPostpone }: TodayPlantCardProps) => {
  const text = useText('today.todayBoard');

  const open = (): void => {
    onOpen(plant);
  };

  const water = (): void => {
    onWater(plant);
  };

  const postpone = (): void => {
    onPostpone(plant);
  };

  return (
    <li className="bg-dex-surface/80 flex flex-col gap-3 rounded-2xl p-2 sm:flex-row sm:items-center sm:pr-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <PlantThumbnail photoUrl={null} size="small" />
        <div className="flex min-w-0 flex-col items-start gap-1">
          <button
            type="button"
            onClick={open}
            className="text-dex-ink focus-visible:outline-dex-ink min-h-11 max-w-full rounded-lg text-left text-base font-bold break-words hover:underline focus-visible:outline-3 focus-visible:outline-offset-2"
          >
            {plant.name}
          </button>
          <UrgencyLabel urgency={plant.urgency} daysUntil={plant.daysUntil} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1 sm:flex-none"
          aria-label={text.wateredLabel({ name: plant.name })}
          onClick={water}
        >
          <Droplets size={18} aria-hidden />
          {text.watered}
        </Button>
        <Button
          variant="secondary"
          className="flex-1 sm:flex-none"
          aria-label={text.postponeLabel({ name: plant.name })}
          onClick={postpone}
        >
          {text.postpone}
        </Button>
      </div>
    </li>
  );
};
