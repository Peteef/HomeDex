import { valueIf } from '#platform/shared';
import type { NewPlant } from '../../../features/plants/index.ts';
import type {
  AddPlantContext,
  AddPlantField,
  AddPlantValues,
  DateLimits,
  FieldError,
  FormErrors,
} from '../types.ts';
import { emptyFormValues, errorsOf, toFields, validateFormFields } from './plantForm.ts';

export const newPlantValues = (today: string): AddPlantValues => ({
  ...emptyFormValues(),
  lastWateredOn: today,
});

// Dates are ISO strings, so comparing them as text compares the days.
const validateLastWatered = (date: string, today: string): FieldError | undefined => {
  if (date === '') {
    return 'dateRequired';
  }

  return valueIf(date > today, 'dateInFuture');
};

export const validateNewPlant = (
  values: AddPlantValues,
  { today }: AddPlantContext,
): FormErrors<AddPlantField> =>
  errorsOf<AddPlantField>([
    ...validateFormFields(values),
    ['lastWateredOn', validateLastWatered(values.lastWateredOn, today)],
  ]);

export const lastWateredLimits = ({ today }: AddPlantContext): DateLimits => ({ max: today });

// A new plant has no photo to keep or remove, so only a chosen one goes with it.
export const toNewPlant = (values: AddPlantValues): NewPlant => ({
  ...toFields(values),
  lastWateredOn: values.lastWateredOn,
  ...(values.photo.kind === 'replace' ? { photo: values.photo.jpeg } : {}),
});
