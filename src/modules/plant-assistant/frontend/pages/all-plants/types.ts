export interface PlantFormValues {
  name: string;
  description: string;
  tags: string[];
  tagDraft: string;
  summerIntervalDays: string;
  winterIntervalDays: string;
  date: string;
}

export type PlantFormField = Exclude<keyof PlantFormValues, 'tags'>;

export type FieldError =
  | 'nameRequired'
  | 'nameTooLong'
  | 'descriptionTooLong'
  | 'intervalInvalid'
  | 'dateRequired'
  | 'dateInFuture'
  | 'dateInPast';

export type PlantFormErrors = Partial<Record<PlantFormField, FieldError>>;

export type TagNote = 'tagTooLong' | 'tagDuplicate' | 'tooManyTags';

export interface DateLimits {
  min?: string;
  max?: string;
}
