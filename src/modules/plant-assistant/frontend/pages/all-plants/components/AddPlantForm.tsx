import { TextInput } from '#platform/frontend';
import { definedProps, lookup } from '#platform/shared';
import { useText } from '../../../locales/index.ts';
import type { DateLimits, AddPlantField, AddPlantValues, FormErrors } from '../types.ts';
import { PlantForm } from './PlantForm.tsx';
import type { PlantFormProps } from './PlantForm.tsx';

export type AddPlantFormProps = Omit<
  PlantFormProps,
  'values' | 'errors' | 'onChange' | 'dateField'
> & {
  values: AddPlantValues;
  errors: FormErrors<AddPlantField>;
  dateLimits: DateLimits;
  onChange: (field: AddPlantField, value: string) => void;
};

export const AddPlantForm = ({
  values,
  errors,
  dateLimits,
  onChange,
  ...form
}: AddPlantFormProps) => {
  const text = useText('allPlants.addPlantForm');
  const errorTexts = useText('allPlants.plantForm.errors');

  const dateField = (
    <TextInput
      label={text.lastWatered}
      type="date"
      value={values.lastWateredOn}
      {...dateLimits}
      {...definedProps({ error: lookup(errorTexts, errors.lastWateredOn) })}
      onChange={(event) => {
        onChange('lastWateredOn', event.target.value);
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
