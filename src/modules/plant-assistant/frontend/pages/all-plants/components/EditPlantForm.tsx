import { TextInput } from '#platform/frontend';
import { useText } from '../../../locales/index.ts';
import type { DateLimits, EditPlantField, EditPlantValues, FormErrors } from '../types.ts';
import { PlantForm } from './PlantForm.tsx';
import type { PlantFormProps } from './PlantForm.tsx';

export type EditPlantFormProps = Omit<
  PlantFormProps,
  'values' | 'errors' | 'onChange' | 'dateField'
> & {
  values: EditPlantValues;
  errors: FormErrors<EditPlantField>;
  dateLimits: DateLimits;
  onChange: (field: EditPlantField, value: string) => void;
};

export const EditPlantForm = ({
  values,
  errors,
  dateLimits,
  onChange,
  ...form
}: EditPlantFormProps) => {
  const text = useText('allPlants.editPlantForm');
  const errorTexts = useText('allPlants.plantForm.errors');
  const error = errors.nextWateringOn;

  const dateField = (
    <TextInput
      label={text.nextWatering}
      type="date"
      value={values.nextWateringOn}
      {...dateLimits}
      {...(error === undefined ? {} : { error: errorTexts[error] })}
      onChange={(event) => {
        onChange('nextWateringOn', event.target.value);
      }}
    />
  );

  return (
    <PlantForm
      values={values}
      errors={errors}
      onChange={onChange}
      dateField={dateField}
      {...form}
    />
  );
};
