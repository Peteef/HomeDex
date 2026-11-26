import { foldText } from '#platform/shared';
import type { PlantFields } from '../../../features/plants/index.ts';
import type {
  ErrorEntry,
  FieldError,
  FormErrors,
  PlantFormField,
  PlantFormValues,
  TagNote,
} from '../types.ts';

export const NAME_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const TAG_MAX_LENGTH = 30;
const MAX_TAGS = 10;
export const MIN_INTERVAL_DAYS = 1;
export const MAX_INTERVAL_DAYS = 365;

const WHOLE_NUMBER = /^\d+$/;

export interface TagAdded<Values extends PlantFormValues> {
  values: Values;
  tagNote: TagNote | null;
}

export const emptyFormValues = (): PlantFormValues => ({
  name: '',
  description: '',
  tags: [],
  tagDraft: '',
  summerIntervalDays: '',
  winterIntervalDays: '',
});

export const formValuesOf = (plant: PlantFields): PlantFormValues => ({
  name: plant.name,
  description: plant.description ?? '',
  tags: plant.tags,
  tagDraft: '',
  summerIntervalDays: String(plant.summerIntervalDays),
  winterIntervalDays: String(plant.winterIntervalDays),
});

const validateName = (name: string): FieldError | undefined => {
  const trimmed = name.trim();

  if (trimmed === '') {
    return 'nameRequired';
  }

  return trimmed.length > NAME_MAX_LENGTH ? 'nameTooLong' : undefined;
};

const validateDescription = (description: string): FieldError | undefined =>
  description.trim().length > DESCRIPTION_MAX_LENGTH ? 'descriptionTooLong' : undefined;

const validateInterval = (days: string): FieldError | undefined => {
  const value = Number(days);

  return WHOLE_NUMBER.test(days) && value >= MIN_INTERVAL_DAYS && value <= MAX_INTERVAL_DAYS
    ? undefined
    : 'intervalInvalid';
};

export const validateFormFields = (values: PlantFormValues): ErrorEntry<PlantFormField>[] => [
  ['name', validateName(values.name)],
  ['description', validateDescription(values.description)],
  ['summerIntervalDays', validateInterval(values.summerIntervalDays)],
  ['winterIntervalDays', validateInterval(values.winterIntervalDays)],
];

export const errorsOf = <Field extends string>(entries: ErrorEntry<Field>[]): FormErrors<Field> =>
  entries.reduce<FormErrors<Field>>(
    (errors, [field, error]) => (error === undefined ? errors : { ...errors, [field]: error }),
    {},
  );

export const hasErrors = (errors: FormErrors<string>): boolean => Object.keys(errors).length > 0;

const tagNoteOf = (tags: string[], tag: string): TagNote | null => {
  if (tag.length > TAG_MAX_LENGTH) {
    return 'tagTooLong';
  }

  if (tags.some((existing) => foldText(existing) === foldText(tag))) {
    return 'tagDuplicate';
  }

  return tags.length >= MAX_TAGS ? 'tooManyTags' : null;
};

export const addTag = <Values extends PlantFormValues>(values: Values): TagAdded<Values> => {
  const tag = values.tagDraft.trim();

  if (tag === '') {
    return {
      values,
      tagNote: null,
    };
  }

  const tagNote = tagNoteOf(values.tags, tag);

  if (tagNote === 'tagDuplicate') {
    return {
      values: { ...values, tagDraft: '' },
      tagNote,
    };
  }

  // A tag that is too long, or one too many, stays in the field to be fixed.
  if (tagNote !== null) {
    return {
      values,
      tagNote,
    };
  }

  return {
    values: { ...values, tags: [...values.tags, tag], tagDraft: '' },
    tagNote,
  };
};

export const removeTag = <Values extends PlantFormValues>(
  values: Values,
  removed: string,
): Values => ({
  ...values,
  tags: values.tags.filter((tag) => tag !== removed),
});

export const toFields = (values: PlantFormValues): PlantFields => {
  const description = values.description.trim();

  return {
    name: values.name.trim(),
    description: description === '' ? null : description,
    tags: values.tags,
    summerIntervalDays: Number(values.summerIntervalDays),
    winterIntervalDays: Number(values.winterIntervalDays),
  };
};
