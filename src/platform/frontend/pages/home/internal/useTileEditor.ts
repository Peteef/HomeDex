import { useState } from 'react';
import type { IconName } from '../../../../shared/icons/iconNames.ts';
import { FORBIDDEN, NOT_FOUND } from '../../../../shared/http/status.ts';
import {
  displayText,
  useCreateTile,
  useDeleteTile,
  useUpdateTile,
} from '../../../features/tiles/index.ts';
import type { Tile, TileScope } from '../../../features/tiles/index.ts';
import { ApiError } from '../../../lib/http/index.ts';
import { LANGUAGES, useLanguage } from '../../../lib/i18n/index.ts';
import type { Language } from '../../../lib/i18n/index.ts';
import type { LanguageText, SaveFailure, TileFormErrors, TileFormValues } from '../types.ts';
import {
  hasErrors,
  missingLanguages,
  newTileValues,
  tileValues,
  toDraft,
  validateTile,
  withLanguage,
  withoutLanguage,
  withText,
} from './tileForm.ts';

type Editing = { mode: 'add' } | { mode: 'edit'; tile: Tile };

const NO_ERRORS: TileFormErrors = { titles: {} };

const FLAGS = Object.fromEntries(LANGUAGES.map(({ code, flag }) => [code, flag])) as Record<
  Language,
  string
>;

const isStatus = (error: unknown, ...statuses: number[]): boolean =>
  error instanceof ApiError && statuses.includes(error.status);

// Errors show after the first save attempt and then follow every change, so they disappear as
// soon as a field is fixed.
export const useTileEditor = () => {
  const { language } = useLanguage();
  const create = useCreateTile();
  const update = useUpdateTile();
  const remove = useDeleteTile();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [values, setValues] = useState<TileFormValues>(() => newTileValues(language));
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<SaveFailure | undefined>(undefined);
  const errors = submitted ? validateTile(values) : NO_ERRORS;

  const start = (next: Editing, initial: TileFormValues): void => {
    setEditing(next);
    setValues(initial);
    setSubmitted(false);
    setFailure(undefined);
  };

  const openAdd = (): void => {
    start({ mode: 'add' }, newTileValues(language));
  };

  const openEdit = (tile: Tile): void => {
    start({ mode: 'edit', tile }, tileValues(tile, language));
  };

  const close = (): void => {
    setEditing(null);
  };

  const failSave = (error: unknown): void => {
    setFailure(isStatus(error, NOT_FOUND, FORBIDDEN) ? 'gone' : 'saveFailed');
  };

  const failDelete = (error: unknown): void => {
    if (isStatus(error, NOT_FOUND)) {
      close();
    } else {
      setFailure(isStatus(error, FORBIDDEN) ? 'gone' : 'deleteFailed');
    }
  };

  const save = (): void => {
    setSubmitted(true);
    setFailure(undefined);

    if (editing === null || hasErrors(validateTile(values))) {
      return;
    }

    const draft = toDraft(values);
    const handlers = { onSuccess: close, onError: failSave };

    if (editing.mode === 'add') {
      create.mutate(draft, handlers);
    } else {
      update.mutate({ id: editing.tile.id, draft }, handlers);
    }
  };

  const deleteTile = (tile: Tile): void => {
    setFailure(undefined);
    remove.mutate(tile.id, { onSuccess: close, onError: failDelete });
  };

  const changeText = (text: LanguageText): void => {
    setValues((current) => withText(current, text));
  };

  const addLanguage = (added: Language): void => {
    setValues((current) => withLanguage(current, added));
  };

  const removeLanguage = (removed: Language): void => {
    setValues((current) => withoutLanguage(current, removed));
  };

  const changeUrl = (url: string): void => {
    setValues((current) => ({
      ...current,
      url,
    }));
  };

  const changeIcon = (icon: IconName): void => {
    setValues((current) => ({
      ...current,
      icon,
    }));
  };

  const changeScope = (scope: TileScope): void => {
    setValues((current) => ({
      ...current,
      scope,
    }));
  };

  const deletionOf = (tile: Tile) => ({
    title: displayText(tile, language).title,
    deleting: remove.isPending,
    onDelete: () => {
      deleteTile(tile);
    },
  });

  const editedTile = editing?.mode === 'edit' ? editing.tile : undefined;

  const dialog = {
    open: editing !== null,
    mode: editing?.mode ?? 'add',
    onClose: close,
    values,
    errors,
    flags: FLAGS,
    missingLanguages: missingLanguages(values),
    scopeLocked: editedTile?.scope === 'shared',
    saving: create.isPending || update.isPending,
    ...(failure === undefined ? {} : { failure }),
    onTextChange: changeText,
    onAddLanguage: addLanguage,
    onRemoveLanguage: removeLanguage,
    onUrlChange: changeUrl,
    onIconChange: changeIcon,
    onScopeChange: changeScope,
    onSubmit: save,
    ...(editedTile === undefined ? {} : { deletion: deletionOf(editedTile) }),
  };

  return {
    dialog,
    openAdd,
    openEdit,
  };
};
