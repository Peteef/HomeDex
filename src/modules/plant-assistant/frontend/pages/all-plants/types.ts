import type { PlantDetails } from '../../features/plants/index.ts';

export interface PlantFormValues {
  name: string;
  description: string;
  tags: string[];
  tagDraft: string;
  summerIntervalDays: string;
  winterIntervalDays: string;
}

export interface AddPlantValues extends PlantFormValues {
  lastWateredOn: string;
}

export interface EditPlantValues extends PlantFormValues {
  nextWateringOn: string;
}

export type PlantFormField = Exclude<keyof PlantFormValues, 'tags'>;
export type AddPlantField = PlantFormField | 'lastWateredOn';
export type EditPlantField = PlantFormField | 'nextWateringOn';

export type FieldError =
  | 'nameRequired'
  | 'nameTooLong'
  | 'descriptionTooLong'
  | 'intervalInvalid'
  | 'dateRequired'
  | 'dateInFuture'
  | 'dateInPast';

export type FormErrors<Field extends string> = Partial<Record<Field, FieldError>>;
export type ErrorEntry<Field extends string> = [Field, FieldError | undefined];

export type TagNote = 'tagTooLong' | 'tagDuplicate' | 'tooManyTags';

export interface DateLimits {
  min?: string;
  max?: string;
}

export interface AddPlantContext {
  today: string;
}

export interface EditPlantContext {
  plant: PlantDetails;
  today: string;
}
