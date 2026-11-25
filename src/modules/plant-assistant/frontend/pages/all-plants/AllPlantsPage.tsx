import { Dialog, LoadFailed, LoadingStatus } from '#platform/frontend';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Section } from '../../components/section/Section.tsx';
import { usePlant, usePlants } from '../../features/plants/index.ts';
import type { PlantSummary } from '../../features/plants/index.ts';
import { useText } from '../../locales/index.ts';
import { PlantDetails } from './components/PlantDetails.tsx';
import { PlantList } from './components/PlantList.tsx';
import { sortByName } from './internal/sortByName.ts';

const MESSAGE_CLASSES = 'text-dex-ink-muted py-4 text-center text-base font-bold';

export const AllPlantsPage = () => {
  const text = useText('allPlants');
  const { i18n } = useTranslation();
  const plants = usePlants();
  const [opened, setOpened] = useState<PlantSummary | null>(null);
  const openPlant = usePlant(opened?.id ?? null);

  const open = (plant: PlantSummary): void => {
    setOpened(plant);
  };

  const close = (): void => {
    setOpened(null);
  };

  const retry = (): void => {
    void plants.refetch();
  };

  const retryOpenPlant = (): void => {
    void openPlant.refetch();
  };

  const renderList = () => {
    if (plants.data !== undefined) {
      return plants.data.plants.length === 0 ? (
        <div role="status" className={MESSAGE_CLASSES}>
          <p>{text.empty}</p>
          <p className="font-semibold">{text.emptyHint}</p>
        </div>
      ) : (
        <PlantList plants={sortByName(plants.data.plants, i18n.language)} onOpen={open} />
      );
    }

    if (plants.isError) {
      return <LoadFailed message={text.loadFailed} onRetry={retry} />;
    }

    return <LoadingStatus />;
  };

  const renderDetails = () => {
    if (openPlant.data !== undefined) {
      return <PlantDetails plant={openPlant.data.plant} />;
    }

    if (openPlant.isError) {
      return <LoadFailed message={text.plantLoadFailed} onRetry={retryOpenPlant} />;
    }

    return <LoadingStatus />;
  };

  return (
    <Section heading={text.heading}>
      {renderList()}
      {/* The row's name titles the dialog while the details load, and after someone else deletes the plant. */}
      {opened === null ? null : (
        <Dialog open title={openPlant.data?.plant.name ?? opened.name} onClose={close}>
          {renderDetails()}
        </Dialog>
      )}
    </Section>
  );
};
