import { photoUrl, useEditPlant } from '../../../features/plants/index.ts';
import type { PlantDetails } from '../../../features/plants/index.ts';
import type { DateLimits } from '../types.ts';
import {
  editPlantValues,
  nextWateringLimits,
  toPlantChanges,
  validatePlantEdit,
} from './editPlantForm.ts';
import { shownPhoto } from './plantForm.ts';
import { usePlantFormState } from './usePlantFormState.ts';

const NO_LIMITS: DateLimits = {};

export const useEditPlantForm = () => {
  const edit = useEditPlant();
  const state = usePlantFormState(validatePlantEdit);

  const open = (plant: PlantDetails, today: string): void => {
    edit.reset();
    state.open({ plant, today }, editPlantValues(plant));
  };

  const save = (): void => {
    state.submit((values, { plant }) => {
      edit.mutate({ id: plant.id, changes: toPlantChanges(values) }, { onSuccess: state.close });
    });
  };

  return {
    form: state.form,
    errors: state.errors,
    dateLimits:
      state.form === null
        ? NO_LIMITS
        : nextWateringLimits(state.form.values.nextWateringOn, state.form.context),
    photoUrl:
      state.form === null
        ? null
        : shownPhoto(state.form.values.photo, photoUrl(state.form.context.plant)),
    saving: edit.isPending,
    failed: edit.isError,
    open,
    close: state.close,
    change: state.change,
    addTag: state.addTag,
    removeTag: state.removeTag,
    choosePhoto: state.choosePhoto,
    removePhoto: state.removePhoto,
    save,
  };
};
