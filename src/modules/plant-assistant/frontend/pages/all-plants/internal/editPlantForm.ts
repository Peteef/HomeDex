import type { PlantChanges, PlantDetails } from '../../../features/plants/index.ts';
import type {
  DateLimits,
  EditPlantContext,
  EditPlantField,
  EditPlantValues,
  FieldError,
  FormErrors,
} from '../types.ts';
import { errorsOf, formValuesOf, toFields, validateFormFields } from './plantForm.ts';

export const editPlantValues = (plant: PlantDetails): EditPlantValues => ({
  ...formValuesOf(plant),
  nextWateringOn: plant.nextWateringOn,
});

// A changed next watering can't be in the past; an unchanged one stays even when it is (R6).
// Dates are ISO strings, so comparing them as text compares the days.
const validateNextWatering = (
  date: string,
  { plant, today }: EditPlantContext,
): FieldError | undefined => {
  if (date === '') {
    return 'dateRequired';
  }

  return date !== plant.nextWateringOn && date < today ? 'dateInPast' : undefined;
};

export const validatePlantEdit = (
  values: EditPlantValues,
  context: EditPlantContext,
): FormErrors<EditPlantField> =>
  errorsOf<EditPlantField>([
    ...validateFormFields(values),
    ['nextWateringOn', validateNextWatering(values.nextWateringOn, context)],
  ]);

export const nextWateringLimits = (date: string, { plant, today }: EditPlantContext): DateLimits =>
  date === plant.nextWateringOn ? {} : { min: today };

export const toPlantChanges = (values: EditPlantValues): PlantChanges => ({
  ...toFields(values),
  nextWateringOn: values.nextWateringOn,
});
