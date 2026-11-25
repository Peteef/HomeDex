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
  const [openId, setOpenId] = useState<number | null>(null);
  const openPlant = usePlant(openId);

  const open = (plant: PlantSummary): void => {
    setOpenId(plant.id);
  };

  const close = (): void => {
    setOpenId(null);
  };

  const retry = (): void => {
    void plants.refetch();
  };

  const retryOpenPlant = (): void => {
    void openPlant.refetch();
  };

  // The list already knows the name, so the dialog has its title while the details load.
  const openName =
    openPlant.data?.plant.name ??
    plants.data?.plants.find((plant) => plant.id === openId)?.name ??
    '';

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
      <Dialog open={openId !== null} title={openName} onClose={close}>
        {renderDetails()}
      </Dialog>
    </Section>
  );
};
