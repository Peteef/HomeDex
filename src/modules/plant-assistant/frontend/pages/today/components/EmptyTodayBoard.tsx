import { UrgencyLabel } from '../../../components/urgency-label/UrgencyLabel.tsx';
import type { PlantSummary } from '../../../features/plants/index.ts';
import { useText } from '../../../locales/index.ts';

export interface EmptyTodayBoardProps {
  next: PlantSummary | null;
  hasPlants: boolean;
}

export const EmptyTodayBoard = ({ next, hasPlants }: EmptyTodayBoardProps) => {
  const text = useText('today.todayBoard');

  return (
    <div role="status" className="text-dex-ink-muted py-4 text-center text-base font-bold">
      <p>{text.nothingToWater}</p>
      {next !== null && (
        <p className="flex flex-wrap items-center justify-center gap-x-2 font-semibold">
          {text.next({ name: next.name })}
          <UrgencyLabel urgency={next.urgency} daysUntil={next.daysUntil} />
        </p>
      )}
      {!hasPlants && (
        <p className="font-semibold">
          <span className="lg:hidden">{text.noPlantsPhone}</span>
          <span className="hidden lg:inline">{text.noPlantsDesktop}</span>
        </p>
      )}
    </div>
  );
};
