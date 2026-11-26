import { useState } from 'react';
import type { FormErrors, PlantFormValues, TagNote } from '../types.ts';
import { addTag, hasErrors, removeTag } from './plantForm.ts';

export interface PlantFormState<Values extends PlantFormValues, Context> {
  context: Context;
  values: Values;
  submitted: boolean;
  tagNote: TagNote | null;
}

const NO_ERRORS = {};

// Errors show after the first save attempt and then follow every change, so they disappear as
// soon as a field is fixed.
export const usePlantFormState = <
  Values extends PlantFormValues,
  Context,
  Field extends keyof Values & string,
>(
  validate: (values: Values, context: Context) => FormErrors<Field>,
) => {
  const [form, setForm] = useState<PlantFormState<Values, Context> | null>(null);

  const errors: FormErrors<Field> =
    form?.submitted === true ? validate(form.values, form.context) : NO_ERRORS;

  const open = (context: Context, values: Values): void => {
    setForm({ context, values, submitted: false, tagNote: null });
  };

  const close = (): void => {
    setForm(null);
  };

  const change = (field: Field, value: string): void => {
    setForm(
      (current) =>
        current && {
          ...current,
          values: { ...current.values, [field]: value },
          tagNote: field === 'tagDraft' ? null : current.tagNote,
        },
    );
  };

  const addDraftTag = (): void => {
    setForm((current) => current && { ...current, ...addTag(current.values) });
  };

  const removeTagNamed = (tag: string): void => {
    setForm(
      (current) => current && { ...current, values: removeTag(current.values, tag), tagNote: null },
    );
  };

  const submit = (save: (values: Values, context: Context) => void): void => {
    if (form === null) {
      return;
    }

    setForm({ ...form, submitted: true });

    if (!hasErrors(validate(form.values, form.context))) {
      save(form.values, form.context);
    }
  };

  return {
    form,
    errors,
    open,
    close,
    change,
    addTag: addDraftTag,
    removeTag: removeTagNamed,
    submit,
  };
};
