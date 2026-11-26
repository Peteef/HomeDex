import { Button, TextInput } from '#platform/frontend';
import type { ReactNode, SubmitEvent } from 'react';
import { TextArea } from '../../../components/text-area/TextArea.tsx';
import { useText } from '../../../locales/index.ts';
import {
  DESCRIPTION_MAX_LENGTH,
  MAX_INTERVAL_DAYS,
  MIN_INTERVAL_DAYS,
  NAME_MAX_LENGTH,
} from '../internal/plantForm.ts';
import type { FormErrors, PlantFormField, PlantFormValues, TagNote } from '../types.ts';
import { PhotoField } from './PhotoField.tsx';
import { TagsInput } from './TagsInput.tsx';

export interface PlantFormProps {
  values: PlantFormValues;
  errors: FormErrors<PlantFormField>;
  tagNote: TagNote | null;
  tagSuggestions: string[];
  photoUrl: string | null;
  photoUnreadable: boolean;
  saving: boolean;
  failed: boolean;
  onChange: (field: PlantFormField, value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onChoosePhoto: (file: File) => void;
  onRemovePhoto: () => void;
  onSubmit: () => void;
  dateField: ReactNode;
}

type IntervalField = 'summerIntervalDays' | 'winterIntervalDays';

export const PlantForm = ({
  values,
  errors,
  tagNote,
  tagSuggestions,
  photoUrl,
  photoUnreadable,
  saving,
  failed,
  onChange,
  onAddTag,
  onRemoveTag,
  onChoosePhoto,
  onRemovePhoto,
  onSubmit,
  dateField,
}: PlantFormProps) => {
  const text = useText('allPlants.plantForm');

  const errorOf = (field: PlantFormField): { error?: string } => {
    const error = errors[field];
    return error === undefined ? {} : { error: text.errors[error] };
  };

  const changeTagDraft = (draft: string): void => {
    onChange('tagDraft', draft);
  };

  const submit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit();
  };

  const interval = (field: IntervalField, label: string) => (
    <div className="flex flex-1 items-start gap-2">
      <div className="min-w-0 flex-1">
        <TextInput
          label={label}
          type="number"
          inputMode="numeric"
          min={MIN_INTERVAL_DAYS}
          max={MAX_INTERVAL_DAYS}
          step={1}
          value={values[field]}
          {...errorOf(field)}
          onChange={(event) => {
            onChange(field, event.target.value);
          }}
        />
      </div>
      <span
        aria-hidden
        className="text-dex-ink mt-6 flex min-h-11 items-center text-base font-bold"
      >
        {text.days}
      </span>
    </div>
  );

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={submit}>
      <TextInput
        label={text.name}
        maxLength={NAME_MAX_LENGTH}
        value={values.name}
        {...errorOf('name')}
        onChange={(event) => {
          onChange('name', event.target.value);
        }}
      />
      <PhotoField
        photoUrl={photoUrl}
        unreadable={photoUnreadable}
        onChoose={onChoosePhoto}
        onRemove={onRemovePhoto}
      />
      <TextArea
        label={text.description}
        rows={3}
        maxLength={DESCRIPTION_MAX_LENGTH}
        value={values.description}
        {...errorOf('description')}
        onChange={(event) => {
          onChange('description', event.target.value);
        }}
      />
      <TagsInput
        tags={values.tags}
        draft={values.tagDraft}
        note={tagNote}
        suggestions={tagSuggestions}
        onDraftChange={changeTagDraft}
        onAdd={onAddTag}
        onRemove={onRemoveTag}
      />
      <fieldset className="flex flex-col gap-1">
        <legend className="text-dex-ink-muted mb-1 px-5 text-sm font-bold">{text.interval}</legend>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          {interval('summerIntervalDays', text.summer)}
          {interval('winterIntervalDays', text.winter)}
        </div>
      </fieldset>
      {dateField}
      {failed && (
        <p role="alert" className="text-dex-red-text px-5 text-base font-bold">
          {text.failed}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? text.saving : text.save}
      </Button>
    </form>
  );
};
