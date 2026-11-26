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
import { PlantForm } from './components/PlantForm.tsx';
import { PlantList } from './components/PlantList.tsx';
import { sortByName } from './internal/sortByName.ts';
import { usePlantEditor } from './internal/usePlantEditor.ts';

const MESSAGE_CLASSES = 'text-dex-ink-muted py-4 text-center text-base font-bold';
const NO_TAGS: string[] = [];

// One dialog at a time: the plant form covers the details and goes back to them when it closes,
// and so does the delete question when it is cancelled.
interface Opened {
  view: 'details' | 'delete';
  plant: PlantSummary;
}

export const AllPlantsPage = () => {
  const text = useText('allPlants');
  const { i18n } = useTranslation();
  const plants = usePlants();
  const tags = useTags();
  const [opened, setOpened] = useState<Opened | null>(null);
  const openPlant = usePlant(opened?.plant.id ?? null);
  const editor = usePlantEditor();
  const remove = useDeletePlant();
  // The row's name titles the dialogs while the details load, and after someone else deletes the plant.
  const openName = openPlant.data?.plant.name ?? opened?.plant.name ?? '';

  const open = (plant: PlantSummary): void => {
    setOpened({ view: 'details', plant });
  };

  const close = (): void => {
    setOpened(null);
  };

  const askToDelete = (plant: PlantSummary): void => {
    remove.reset();
    setOpened({ view: 'delete', plant });
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
              editor.openAdd(today);
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
            editor.openEdit(details, today);
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

  const renderOpened = ({ view, plant }: Opened) =>
    view === 'details' ? (
      <Dialog key="details" open title={openName} onClose={close}>
        {renderDetails(plant)}
      </Dialog>
    ) : (
      <Dialog
        key="delete"
        open
        title={text.deleteConfirmation.title({ name: openName })}
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

  const renderForm = () => {
    const { editing } = editor;

    if (editing === null) {
      return null;
    }

    const title =
      editing.target.mode === 'add'
        ? text.plantForm.addTitle
        : text.plantForm.editTitle({ name: editing.target.plant.name });

    return (
      <Dialog open title={title} onClose={editor.close}>
        <PlantForm
          mode={editing.target.mode}
          values={editing.values}
          errors={editor.errors}
          tagNote={editing.tagNote}
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
  };

  return (
    <Section heading={text.heading}>
      {renderList()}
      {opened === null || editor.editing !== null ? null : renderOpened(opened)}
      {renderForm()}
    </Section>
  );
};
