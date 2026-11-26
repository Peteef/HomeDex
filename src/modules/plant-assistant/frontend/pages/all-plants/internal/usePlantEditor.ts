import { useState } from 'react';
import { useCreatePlant, useEditPlant } from '../../../features/plants/index.ts';
import type { PlantDetails } from '../../../features/plants/index.ts';
import type {
  DateLimits,
  PlantFormErrors,
  PlantFormField,
  PlantFormValues,
  TagNote,
} from '../types.ts';
import {
  addTag,
  dateLimitsOf,
  hasErrors,
  newPlantValues,
  plantValues,
  removeTag,
  toNewPlant,
  toPlantChanges,
  validatePlant,
} from './plantForm.ts';
import type { FormTarget } from './plantForm.ts';

interface Editing {
  target: FormTarget;
  today: string;
  values: PlantFormValues;
  submitted: boolean;
  tagNote: TagNote | null;
}

const NO_ERRORS: PlantFormErrors = {};
const NO_LIMITS: DateLimits = {};

// Errors show after the first save attempt and then follow every change, so they disappear as
// soon as a field is fixed.
export const usePlantEditor = () => {
  const create = useCreatePlant();
  const edit = useEditPlant();
  const [editing, setEditing] = useState<Editing | null>(null);

  const errors =
    editing?.submitted === true
      ? validatePlant(editing.values, editing.target, editing.today)
      : NO_ERRORS;

  const start = (target: FormTarget, today: string, values: PlantFormValues): void => {
    create.reset();
    edit.reset();
    setEditing({ target, today, values, submitted: false, tagNote: null });
  };

  const openAdd = (today: string): void => {
    start({ mode: 'add' }, today, newPlantValues(today));
  };

  const openEdit = (plant: PlantDetails, today: string): void => {
    start({ mode: 'edit', plant }, today, plantValues(plant));
  };

  const close = (): void => {
    setEditing(null);
  };

  const change = (field: PlantFormField, value: string): void => {
    setEditing(
      (current) =>
        current && {
          ...current,
          values: { ...current.values, [field]: value },
          tagNote: field === 'tagDraft' ? null : current.tagNote,
        },
    );
  };

  const addDraftTag = (): void => {
    setEditing((current) => current && { ...current, ...addTag(current.values) });
  };

  const removeTagNamed = (tag: string): void => {
    setEditing(
      (current) => current && { ...current, values: removeTag(current.values, tag), tagNote: null },
    );
  };

  const save = (): void => {
    if (editing === null) {
      return;
    }

    setEditing({ ...editing, submitted: true });

    if (hasErrors(validatePlant(editing.values, editing.target, editing.today))) {
      return;
    }

    if (editing.target.mode === 'add') {
      create.mutate(toNewPlant(editing.values), { onSuccess: close });
    } else {
      edit.mutate(
        { id: editing.target.plant.id, changes: toPlantChanges(editing.values) },
        { onSuccess: close },
      );
    }
  };

  return {
    editing,
    errors,
    dateLimits:
      editing === null
        ? NO_LIMITS
        : dateLimitsOf(editing.target, editing.today, editing.values.date),
    saving: create.isPending || edit.isPending,
    failed: create.isError || edit.isError,
    openAdd,
    openEdit,
    close,
    change,
    addTag: addDraftTag,
    removeTag: removeTagNamed,
    save,
  };
};
