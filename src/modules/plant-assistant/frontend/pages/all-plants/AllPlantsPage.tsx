import { Button, Dialog, LoadFailed, LoadingStatus } from '#platform/frontend';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Section } from '../../components/section/Section.tsx';
import { useDeletePlant, usePlant, usePlants, useTags } from '../../features/plants/index.ts';
import type { PlantSummary } from '../../features/plants/index.ts';
import { useText } from '../../locales/index.ts';
import { DeleteConfirmation } from './components/DeleteConfirmation.tsx';
import { PlantDetails } from './components/PlantDetails.tsx';
import { AddPlantForm } from './components/AddPlantForm.tsx';
import { EditPlantForm } from './components/EditPlantForm.tsx';
import { PlantList } from './components/PlantList.tsx';
import { sortByName } from './internal/sortByName.ts';
import { useAddPlantForm } from './internal/useAddPlantForm.ts';
import { useEditPlantForm } from './internal/useEditPlantForm.ts';

const MESSAGE_CLASSES = 'text-dex-ink-muted py-4 text-center text-base font-bold';
const NO_TAGS: string[] = [];

// One dialog at a time: the plant form covers the details and goes back to them when it closes,
// and so does the delete question when it is cancelled.
interface Opened {
  view: 'details' | 'delete';
  plantId: number;
}

export const AllPlantsPage = () => {
  const text = useText('allPlants');
  const { i18n } = useTranslation();
  const plants = usePlants();
  const tags = useTags();
  const [opened, setOpened] = useState<Opened | null>(null);
  const openPlant = usePlant(opened?.plantId ?? null);
  const adder = useAddPlantForm();
  const editor = useEditPlantForm();
  const remove = useDeletePlant();
  const formOpen = adder.form !== null || editor.form !== null;

  // The list names the open plant, so a plant deleted elsewhere closes its dialog.
  const openedPlant =
    opened === null ? undefined : plants.data?.plants.find(({ id }) => id === opened.plantId);

  const open = (plant: PlantSummary): void => {
    setOpened({ view: 'details', plantId: plant.id });
  };

  const close = (): void => {
    setOpened(null);
  };

  const askToDelete = (plant: PlantSummary): void => {
    remove.reset();
    setOpened({ view: 'delete', plantId: plant.id });
  };

  const deleteOpened = (plant: PlantSummary): void => {
    remove.mutate(plant.id, { onSuccess: close });
  };

  const retry = (): void => {
    void plants.refetch();
  };

  const retryOpenPlant = (): void => {
    void openPlant.refetch();
  };

  const renderList = () => {
    if (plants.data !== undefined) {
      const { today } = plants.data;

      return (
        <>
          <Button
            className="self-stretch sm:self-end"
            onClick={() => {
              adder.open(today);
            }}
          >
            <Plus size={18} aria-hidden />
            {text.add}
          </Button>
          {plants.data.plants.length === 0 ? (
            <div role="status" className={MESSAGE_CLASSES}>
              <p>{text.empty}</p>
              <p className="font-semibold">{text.emptyHint}</p>
            </div>
          ) : (
            <PlantList plants={sortByName(plants.data.plants, i18n.language)} onOpen={open} />
          )}
        </>
      );
    }

    if (plants.isError) {
      return <LoadFailed message={text.loadFailed} onRetry={retry} />;
    }

    return <LoadingStatus />;
  };

  const renderDetails = (plant: PlantSummary) => {
    if (openPlant.data !== undefined) {
      const { plant: details, today } = openPlant.data;

      return (
        <PlantDetails
          plant={details}
          onEdit={() => {
            editor.open(details, today);
          }}
          onDelete={() => {
            askToDelete(plant);
          }}
        />
      );
    }

    if (openPlant.isError) {
      return <LoadFailed message={text.plantLoadFailed} onRetry={retryOpenPlant} />;
    }

    return <LoadingStatus />;
  };

  const renderOpenedDialog = (view: Opened['view'], plant: PlantSummary) =>
    view === 'details' ? (
      <Dialog key="details" open title={plant.name} onClose={close}>
        {renderDetails(plant)}
      </Dialog>
    ) : (
      <Dialog
        key="delete"
        open
        title={text.deleteConfirmation.title({ name: plant.name })}
        onClose={() => {
          open(plant);
        }}
      >
        <DeleteConfirmation
          deleting={remove.isPending}
          failed={remove.isError}
          onDelete={() => {
            deleteOpened(plant);
          }}
          onCancel={() => {
            open(plant);
          }}
        />
      </Dialog>
    );

  const renderOpened = () => {
    if (formOpen || opened === null || openedPlant === undefined) {
      return null;
    }

    return renderOpenedDialog(opened.view, openedPlant);
  };

  const renderAddForm = () =>
    adder.form !== null && (
      <Dialog open title={text.addPlantForm.title} onClose={adder.close}>
        <AddPlantForm
          values={adder.form.values}
          errors={adder.errors}
          tagNote={adder.form.tagNote}
          tagSuggestions={tags.data?.tags ?? NO_TAGS}
          dateLimits={adder.dateLimits}
          saving={adder.saving}
          failed={adder.failed}
          onChange={adder.change}
          onAddTag={adder.addTag}
          onRemoveTag={adder.removeTag}
          onSubmit={adder.save}
        />
      </Dialog>
    );

  const renderEditForm = () =>
    editor.form !== null && (
      <Dialog
        open
        title={text.editPlantForm.title({ name: editor.form.context.plant.name })}
        onClose={editor.close}
      >
        <EditPlantForm
          values={editor.form.values}
          errors={editor.errors}
          tagNote={editor.form.tagNote}
          tagSuggestions={tags.data?.tags ?? NO_TAGS}
          dateLimits={editor.dateLimits}
          saving={editor.saving}
          failed={editor.failed}
          onChange={editor.change}
          onAddTag={editor.addTag}
          onRemoveTag={editor.removeTag}
          onSubmit={editor.save}
        />
      </Dialog>
    );

  return (
    <Section heading={text.heading}>
      {renderList()}
      {renderOpened()}
      {renderAddForm()}
      {renderEditForm()}
    </Section>
  );
};
