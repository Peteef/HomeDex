import { Dialog, LoadFailed, LoadingStatus } from '#platform/frontend';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlantDetailsDialog } from '../../components/plant-details/PlantDetailsDialog.tsx';
import { Section } from '../../components/section/Section.tsx';
import { TagChip } from '../../components/tag-chip/TagChip.tsx';
import { UndoNotice } from '../../components/undo-notice/UndoNotice.tsx';
import { photoUrl, usePlant, usePlants } from '../../features/plants/index.ts';
import type { PlantSummary } from '../../features/plants/index.ts';
import {
  isConflict,
  usePostpone,
  useUndoWatering,
  useWater,
} from '../../features/watering/index.ts';
import type { Watering } from '../../features/watering/index.ts';
import { useText } from '../../locales/index.ts';
import { EmptyTodayBoard } from './components/EmptyTodayBoard.tsx';
import { PostponeChoice } from './components/PostponeChoice.tsx';
import { TodayBoard } from './components/TodayBoard.tsx';
import { duePlants, nextPlant } from './internal/duePlants.ts';
import { useNotice } from './internal/useNotice.ts';

type Notice =
  | { kind: 'watered'; plant: PlantSummary; watering: Watering }
  | { kind: 'alreadyDone'; name: string }
  | { kind: 'waterFailed'; name: string }
  | { kind: 'undoConflict' }
  | { kind: 'undoFailed' };

export const TodayPage = () => {
  const text = useText('today');
  const common = useText('common');
  const { i18n } = useTranslation();
  const plants = usePlants();
  const water = useWater();
  const undo = useUndoWatering();
  const postpone = usePostpone();
  const notices = useNotice<Notice>();
  // Plants watered but not saved yet leave the board at once, and come back if saving fails.
  const [hidden, setHidden] = useState<number[]>([]);
  const [openedId, setOpenedId] = useState<number | null>(null);
  const [postponing, setPostponing] = useState<PlantSummary | null>(null);
  const openPlant = usePlant(openedId);
  const { notice } = notices;
  const canUndo = notice?.kind === 'watered';

  // The list names the open plant, so a plant deleted elsewhere closes its dialog.
  const openedPlant =
    openedId === null ? undefined : plants.data?.plants.find(({ id }) => id === openedId);

  const messageOf = (shown: Notice | null): string | null => {
    if (shown === null) {
      return null;
    }

    switch (shown.kind) {
      case 'watered':
        return text.notices.watered({ name: shown.plant.name });
      case 'alreadyDone':
        return text.notices.alreadyDone({ name: shown.name });
      case 'waterFailed':
        return text.notices.waterFailed({ name: shown.name });
      case 'undoConflict':
        return text.notices.undoConflict;
      case 'undoFailed':
        return text.notices.undoFailed;
    }
  };

  const failWatering = (plant: PlantSummary, error: unknown): void => {
    notices.show(
      isConflict(error)
        ? { kind: 'alreadyDone', name: plant.name }
        : { kind: 'waterFailed', name: plant.name },
    );
  };

  // mutateAsync, because mutate's callbacks fire only for the latest of several waterings.
  const waterPlant = (plant: PlantSummary): void => {
    setHidden((ids) => [...ids, plant.id]);

    void water
      .mutateAsync(plant.id)
      .then(
        (watering) => {
          notices.show({ kind: 'watered', plant, watering });
        },
        (error: unknown) => {
          failWatering(plant, error);
        },
      )
      .finally(() => {
        setHidden((ids) => ids.filter((id) => id !== plant.id));
      });
  };

  const failUndo = (error: unknown): void => {
    notices.show(isConflict(error) ? { kind: 'undoConflict' } : { kind: 'undoFailed' });
  };

  const undoWatering = (): void => {
    if (notice?.kind !== 'watered') {
      return;
    }

    const { plant, watering } = notice;
    undo.mutate({ plantId: plant.id, ...watering }, { onSuccess: notices.hide, onError: failUndo });
  };

  const startPostponing = (plant: PlantSummary): void => {
    postpone.reset();
    setPostponing(plant);
  };

  const stopPostponing = (): void => {
    setPostponing(null);
  };

  const failPostpone = (plant: PlantSummary, error: unknown): void => {
    if (isConflict(error)) {
      stopPostponing();
      notices.show({ kind: 'alreadyDone', name: plant.name });
    }
  };

  const postponeBy = (plant: PlantSummary, days: number): void => {
    postpone.mutate(
      { plantId: plant.id, days },
      {
        onSuccess: stopPostponing,
        onError: (error) => {
          failPostpone(plant, error);
        },
      },
    );
  };

  const openDetails = (plant: PlantSummary): void => {
    setOpenedId(plant.id);
  };

  const closeDetails = (): void => {
    setOpenedId(null);
  };

  const renderTag = (tag: string) => <TagChip tag={tag} />;

  const retry = (): void => {
    void plants.refetch();
  };

  const retryOpenPlant = (): void => {
    void openPlant.refetch();
  };

  const renderBoard = () => {
    if (plants.data !== undefined) {
      const all = plants.data.plants;

      const due = duePlants(
        all.filter((plant) => !hidden.includes(plant.id)),
        i18n.language,
      );

      if (due.length === 0) {
        return <EmptyTodayBoard next={nextPlant(all, i18n.language)} hasPlants={all.length > 0} />;
      }

      return (
        <TodayBoard
          plants={due}
          onOpen={openDetails}
          onWater={waterPlant}
          onPostpone={startPostponing}
        />
      );
    }

    if (plants.isError) {
      return <LoadFailed message={common.plantsLoadFailed} onRetry={retry} />;
    }

    return <LoadingStatus />;
  };

  return (
    <Section heading={text.heading}>
      {renderBoard()}
      {openedPlant !== undefined && (
        <PlantDetailsDialog
          title={openedPlant.name}
          plant={openPlant.data?.plant}
          photoUrl={openPlant.data === undefined ? null : photoUrl(openPlant.data.plant)}
          renderTag={renderTag}
          actions={null}
          failed={openPlant.isError}
          onRetry={retryOpenPlant}
          onClose={closeDetails}
        />
      )}
      {postponing !== null && (
        <Dialog
          open
          title={text.postponeChoice.title({ name: postponing.name })}
          onClose={stopPostponing}
        >
          <PostponeChoice
            postponing={postpone.isPending}
            failed={postpone.isError}
            onPostpone={(days) => {
              postponeBy(postponing, days);
            }}
          />
        </Dialog>
      )}
      <UndoNotice
        message={messageOf(notice)}
        canUndo={canUndo}
        undoing={undo.isPending}
        onUndo={undoWatering}
        onPause={notices.pause}
        onResume={notices.resume}
      />
    </Section>
  );
};
