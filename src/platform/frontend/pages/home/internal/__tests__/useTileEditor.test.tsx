import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  fakeApi,
  ok,
  status,
  testQueryClient,
  withProviders,
} from '../../../../__tests__/helpers.tsx';
import { linkTile } from '../../../../__tests__/tiles.ts';
import { useTileEditor } from '../useTileEditor.ts';

const FINANCES = linkTile(
  {
    en: { title: 'Finances', description: null },
    pl: { title: 'Finanse', description: null },
  },
  { id: 7, scope: 'shared', url: 'https://docs.example.com/budget', icon: 'wallet' },
);

const PERSONAL = linkTile(
  { en: { title: 'Diary', description: null } },
  { id: 8, scope: 'personal' },
);

const renderEditor = () => {
  const queryClient = testQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) =>
    withProviders(children, { queryClient });

  return renderHook(useTileEditor, { wrapper }).result;
};

const fillNewTile = (editor: ReturnType<typeof renderEditor>) => {
  act(() => {
    editor.current.openAdd();
  });

  act(() => {
    editor.current.dialog.onTextChange({ language: 'en', title: 'Recipes', description: '' });
    editor.current.dialog.onUrlChange('https://docs.example.com/recipes');
    editor.current.dialog.onIconChange('food');
  });
};

describe('useTileEditor', () => {
  it('should start closed', () => {
    // When
    const editor = renderEditor();

    // Then
    expect(editor.current.dialog.open).toBe(false);
  });

  it('should open an empty add form with every other language to add', () => {
    // Given
    const editor = renderEditor();

    // When
    act(() => {
      editor.current.openAdd();
    });

    // Then
    expect(editor.current.dialog).toMatchObject({
      open: true,
      mode: 'add',
      values: {
        texts: [{ language: 'en', title: '', description: '' }],
        url: '',
        icon: 'link',
        scope: 'personal',
      },
      missingLanguages: ['pl'],
      scopeLocked: false,
    });

    expect(editor.current.dialog.deletion).toBeUndefined();
  });

  it('should show no errors before the first save attempt', () => {
    // Given
    const editor = renderEditor();

    // When
    act(() => {
      editor.current.openAdd();
    });

    // Then
    expect(editor.current.dialog.errors).toEqual({ titles: {} });
  });

  it('should show the errors and send nothing when a save fails validation', () => {
    // Given
    const api = fakeApi({});
    const editor = renderEditor();

    act(() => {
      editor.current.openAdd();
    });

    // When
    act(() => {
      editor.current.dialog.onSubmit();
    });

    // Then
    expect(editor.current.dialog.errors).toEqual({
      titles: { en: 'titleRequired' },
      url: 'urlRequired',
    });

    expect(api.calls).toHaveLength(0);
  });

  it('should clear an error as soon as the field is fixed', () => {
    // Given
    const editor = renderEditor();

    act(() => {
      editor.current.openAdd();
    });

    act(() => {
      editor.current.dialog.onSubmit();
    });

    // When
    act(() => {
      editor.current.dialog.onUrlChange('https://docs.example.com/recipes');
    });

    // Then
    expect(editor.current.dialog.errors.url).toBeUndefined();
  });

  it('should create the tile and close when the save works', async () => {
    // Given
    const api = fakeApi({
      'POST /api/tiles': { status: 201, body: { tile: FINANCES } },
      'GET /api/tiles': ok({ tiles: [FINANCES] }),
    });

    const editor = renderEditor();
    fillNewTile(editor);

    // When
    act(() => {
      editor.current.dialog.onSubmit();
    });

    // Then
    await waitFor(() => {
      expect(editor.current.dialog.open).toBe(false);
    });

    expect(api.callsTo('POST /api/tiles')[0]?.body).toEqual({
      texts: { en: { title: 'Recipes', description: null } },
      url: 'https://docs.example.com/recipes',
      icon: 'food',
      scope: 'personal',
    });
  });

  it('should stay open with a message when the save fails', async () => {
    // Given
    fakeApi({ 'POST /api/tiles': status(500), 'GET /api/tiles': ok({ tiles: [] }) });
    const editor = renderEditor();
    fillNewTile(editor);

    // When
    act(() => {
      editor.current.dialog.onSubmit();
    });

    // Then
    await waitFor(() => {
      expect(editor.current.dialog.failure).toBe('saveFailed');
    });

    expect(editor.current.dialog.open).toBe(true);
  });

  it('should open the edit form with the tile and its languages', () => {
    // Given
    const editor = renderEditor();

    // When
    act(() => {
      editor.current.openEdit(FINANCES);
    });

    // Then
    expect(editor.current.dialog).toMatchObject({
      open: true,
      mode: 'edit',
      missingLanguages: [],
      scopeLocked: true,
      deletion: { title: 'Finances', deleting: false },
    });

    expect(editor.current.dialog.values.texts.map(({ language }) => language)).toEqual([
      'en',
      'pl',
    ]);
  });

  it('should let the scope of a personal tile change', () => {
    // Given
    const editor = renderEditor();

    // When
    act(() => {
      editor.current.openEdit(PERSONAL);
    });

    // Then
    expect(editor.current.dialog.scopeLocked).toBe(false);
  });

  it('should add and remove a language block', () => {
    // Given
    const editor = renderEditor();

    act(() => {
      editor.current.openAdd();
    });

    // When
    act(() => {
      editor.current.dialog.onAddLanguage('pl');
    });

    act(() => {
      editor.current.dialog.onRemoveLanguage('en');
    });

    // Then
    expect(editor.current.dialog.values.texts).toEqual([
      { language: 'pl', title: '', description: '' },
    ]);

    expect(editor.current.dialog.missingLanguages).toEqual(['en']);
  });

  it('should save the edited tile with PATCH', async () => {
    // Given
    const api = fakeApi({
      'PATCH /api/tiles/8': ok({ tile: PERSONAL }),
      'GET /api/tiles': ok({ tiles: [PERSONAL] }),
    });

    const editor = renderEditor();

    act(() => {
      editor.current.openEdit(PERSONAL);
    });

    act(() => {
      editor.current.dialog.onScopeChange('shared');
    });

    // When
    act(() => {
      editor.current.dialog.onSubmit();
    });

    // Then
    await waitFor(() => {
      expect(editor.current.dialog.open).toBe(false);
    });

    expect(api.callsTo('PATCH /api/tiles/8')[0]?.body).toMatchObject({ scope: 'shared' });
  });

  it('should say the tile is gone when the edit answers 404', async () => {
    // Given
    fakeApi({ 'PATCH /api/tiles/8': status(404), 'GET /api/tiles': ok({ tiles: [] }) });
    const editor = renderEditor();

    act(() => {
      editor.current.openEdit(PERSONAL);
    });

    // When
    act(() => {
      editor.current.dialog.onSubmit();
    });

    // Then
    await waitFor(() => {
      expect(editor.current.dialog.failure).toBe('gone');
    });
  });

  it('should delete the tile and close', async () => {
    // Given
    const api = fakeApi({
      'DELETE /api/tiles/7': { status: 204 },
      'GET /api/tiles': ok({ tiles: [] }),
    });

    const editor = renderEditor();

    act(() => {
      editor.current.openEdit(FINANCES);
    });

    // When
    act(() => {
      editor.current.dialog.deletion?.onDelete();
    });

    // Then
    await waitFor(() => {
      expect(editor.current.dialog.open).toBe(false);
    });

    expect(api.callsTo('DELETE /api/tiles/7')).toHaveLength(1);
  });

  it('should close when the tile to delete is already gone', async () => {
    // Given
    fakeApi({ 'DELETE /api/tiles/7': status(404), 'GET /api/tiles': ok({ tiles: [] }) });
    const editor = renderEditor();

    act(() => {
      editor.current.openEdit(FINANCES);
    });

    // When
    act(() => {
      editor.current.dialog.deletion?.onDelete();
    });

    // Then
    await waitFor(() => {
      expect(editor.current.dialog.open).toBe(false);
    });
  });

  it('should stay open with a message when the delete fails', async () => {
    // Given
    fakeApi({ 'DELETE /api/tiles/7': status(500), 'GET /api/tiles': ok({ tiles: [] }) });
    const editor = renderEditor();

    act(() => {
      editor.current.openEdit(FINANCES);
    });

    // When
    act(() => {
      editor.current.dialog.deletion?.onDelete();
    });

    // Then
    await waitFor(() => {
      expect(editor.current.dialog.failure).toBe('deleteFailed');
    });
  });

  it('should close on request', () => {
    // Given
    const editor = renderEditor();

    act(() => {
      editor.current.openAdd();
    });

    // When
    act(() => {
      editor.current.dialog.onClose();
    });

    // Then
    expect(editor.current.dialog.open).toBe(false);
  });
});
