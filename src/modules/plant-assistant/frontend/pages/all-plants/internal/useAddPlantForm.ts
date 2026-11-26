import { useCreatePlant } from '../../../features/plants/index.ts';
import type { DateLimits } from '../types.ts';
import { lastWateredLimits, newPlantValues, toNewPlant, validateNewPlant } from './addPlantForm.ts';
import { shownPhoto } from './plantForm.ts';
import { usePlantFormState } from './usePlantFormState.ts';

const NO_LIMITS: DateLimits = {};

export const useAddPlantForm = () => {
  const create = useCreatePlant();
  const state = usePlantFormState(validateNewPlant);

  const open = (today: string): void => {
    create.reset();
    state.open({ today }, newPlantValues(today));
  };

  const save = (): void => {
    state.submit((values) => {
      create.mutate(toNewPlant(values), { onSuccess: state.close });
    });
  };

  return {
    form: state.form,
    errors: state.errors,
    dateLimits: state.form === null ? NO_LIMITS : lastWateredLimits(state.form.context),
    photoUrl: state.form === null ? null : shownPhoto(state.form.values.photo, null),
    saving: create.isPending,
    failed: create.isError,
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
