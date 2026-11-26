import { foldText } from '#platform/shared';
import type {
  NewPlant,
  PlantChanges,
  PlantDetails,
  PlantFields,
} from '../../../features/plants/index.ts';
import type {
  DateLimits,
  FieldError,
  PlantFormErrors,
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

export type FormTarget = { mode: 'add' } | { mode: 'edit'; plant: PlantDetails };

export interface TagAdded {
  values: PlantFormValues;
  tagNote: TagNote | null;
}

export const newPlantValues = (today: string): PlantFormValues => ({
  name: '',
  description: '',
  tags: [],
  tagDraft: '',
  summerIntervalDays: '',
  winterIntervalDays: '',
  date: today,
});

export const plantValues = (plant: PlantDetails): PlantFormValues => ({
  name: plant.name,
  description: plant.description ?? '',
  tags: plant.tags,
  tagDraft: '',
  summerIntervalDays: String(plant.summerIntervalDays),
  winterIntervalDays: String(plant.winterIntervalDays),
  date: plant.nextWateringOn,
});

const nameError = (name: string): FieldError | undefined => {
  const trimmed = name.trim();

  if (trimmed === '') {
    return 'nameRequired';
  }

  return trimmed.length > NAME_MAX_LENGTH ? 'nameTooLong' : undefined;
};

const descriptionError = (description: string): FieldError | undefined =>
  description.trim().length > DESCRIPTION_MAX_LENGTH ? 'descriptionTooLong' : undefined;

const intervalError = (days: string): FieldError | undefined => {
  const value = Number(days);

  return WHOLE_NUMBER.test(days) && value >= MIN_INTERVAL_DAYS && value <= MAX_INTERVAL_DAYS
    ? undefined
    : 'intervalInvalid';
};

// Dates are ISO strings, so comparing them as text compares the days.
const dateError = (date: string, target: FormTarget, today: string): FieldError | undefined => {
  if (date === '') {
    return 'dateRequired';
  }

  if (target.mode === 'add') {
    return date > today ? 'dateInFuture' : undefined;
  }

  return date !== target.plant.nextWateringOn && date < today ? 'dateInPast' : undefined;
};

export const validatePlant = (
  values: PlantFormValues,
  target: FormTarget,
  today: string,
): PlantFormErrors => {
  const errors: [PlantFormField, FieldError | undefined][] = [
    ['name', nameError(values.name)],
    ['description', descriptionError(values.description)],
    ['summerIntervalDays', intervalError(values.summerIntervalDays)],
    ['winterIntervalDays', intervalError(values.winterIntervalDays)],
    ['date', dateError(values.date, target, today)],
  ];

  return Object.fromEntries(errors.filter(([, error]) => error !== undefined));
};

export const hasErrors = (errors: PlantFormErrors): boolean => Object.keys(errors).length > 0;

// A changed next watering can't be in the past; an unchanged one stays even when it is (R6).
export const dateLimitsOf = (target: FormTarget, today: string, date: string): DateLimits => {
  if (target.mode === 'add') {
    return { max: today };
  }

  return date === target.plant.nextWateringOn ? {} : { min: today };
};

const tagNoteOf = (tags: string[], tag: string): TagNote | null => {
  if (tag.length > TAG_MAX_LENGTH) {
    return 'tagTooLong';
  }

  if (tags.some((existing) => foldText(existing) === foldText(tag))) {
    return 'tagDuplicate';
  }

  return tags.length >= MAX_TAGS ? 'tooManyTags' : null;
};

// A duplicate is dropped from the field; a tag that is too long, or one too many, stays there
// to be fixed.
export const addTag = (values: PlantFormValues): TagAdded => {
  const tag = values.tagDraft.trim();
  const tagNote = tag === '' ? null : tagNoteOf(values.tags, tag);

  if (tag === '' || (tagNote !== null && tagNote !== 'tagDuplicate')) {
    return {
      values,
      tagNote,
    };
  }

  return {
    values: {
      ...values,
      tags: tagNote === null ? [...values.tags, tag] : values.tags,
      tagDraft: '',
    },
    tagNote,
  };
};

export const removeTag = (values: PlantFormValues, removed: string): PlantFormValues => ({
  ...values,
  tags: values.tags.filter((tag) => tag !== removed),
});

const toFields = (values: PlantFormValues): PlantFields => {
  const description = values.description.trim();

  return {
    name: values.name.trim(),
    description: description === '' ? null : description,
    tags: values.tags,
    summerIntervalDays: Number(values.summerIntervalDays),
    winterIntervalDays: Number(values.winterIntervalDays),
  };
};

export const toNewPlant = (values: PlantFormValues): NewPlant => ({
  ...toFields(values),
  lastWateredOn: values.date,
});

export const toPlantChanges = (values: PlantFormValues): PlantChanges => ({
  ...toFields(values),
  nextWateringOn: values.date,
});
