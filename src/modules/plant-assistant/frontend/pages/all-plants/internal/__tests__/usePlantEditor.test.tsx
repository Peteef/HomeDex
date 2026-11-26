import { fakeApi, status, withProviders } from '#platform/frontend/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import type { PlantDetails } from '../../../../features/plants/index.ts';
import { usePlantEditor } from '../usePlantEditor.ts';

const CREATE = 'POST /api/m/plant-assistant/plants';
const EDIT = 'PUT /api/m/plant-assistant/plants/1';
const TODAY = '2026-11-20';

const FERN: PlantDetails = {
  id: 1,
  name: "Bulbasaur's fern",
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-10',
  nextWateringOn: '2026-11-17',
  daysUntil: -3,
  urgency: 'overdue',
  summerIntervalDays: 7,
  winterIntervalDays: 14,
  currentSeason: 'winter',
};

const wrapper = ({ children }: { children: ReactNode }) => withProviders(children);

const renderEditor = () => renderHook(() => usePlantEditor(), { wrapper });

type Editor = ReturnType<typeof renderEditor>;

const fillIn = (editor: Editor) => {
  act(() => {
    editor.result.current.change('name', '  Oddish ');
    editor.result.current.change('summerIntervalDays', '5');
    editor.result.current.change('winterIntervalDays', '10');
  });
};

describe('usePlantEditor', () => {
  it('should edit nothing at first', () => {
    // When
    const { result } = renderEditor();

    // Then
    expect(result.current.editing).toBeNull();
  });

  it('should start adding with an empty form, last watered today', () => {
    // Given
    const editor = renderEditor();

    // When
    act(() => {
      editor.result.current.openAdd(TODAY);
    });

    // Then
    expect(editor.result.current.editing?.target).toEqual({ mode: 'add' });
    expect(editor.result.current.editing?.values.date).toBe('2026-11-20');
    expect(editor.result.current.dateLimits).toEqual({ max: '2026-11-20' });
  });

  it('should start editing with the values of the plant', () => {
    // Given
    const editor = renderEditor();

    // When
    act(() => {
      editor.result.current.openEdit(FERN, TODAY);
    });

    // Then
    expect(editor.result.current.editing?.values.name).toBe("Bulbasaur's fern");
    expect(editor.result.current.editing?.values.date).toBe('2026-11-17');
    expect(editor.result.current.dateLimits).toEqual({});
  });

  it('should show errors only after a save attempt, and follow the changes from then on', () => {
    // Given
    const api = fakeApi({});
    const editor = renderEditor();

    act(() => {
      editor.result.current.openAdd(TODAY);
    });

    expect(editor.result.current.errors).toEqual({});

    // When
    act(() => {
      editor.result.current.save();
    });

    // Then
    expect(editor.result.current.errors).toEqual({
      name: 'nameRequired',
      summerIntervalDays: 'intervalInvalid',
      winterIntervalDays: 'intervalInvalid',
    });

    expect(api.calls).toHaveLength(0);

    // When
    act(() => {
      editor.result.current.change('name', 'Oddish');
    });

    // Then
    expect(editor.result.current.errors.name).toBeUndefined();
  });

  it('should create the plant from the trimmed values and close when it is saved', async () => {
    // Given
    const api = fakeApi({ [CREATE]: { status: 201, body: { plant: FERN } } });
    const editor = renderEditor();

    act(() => {
      editor.result.current.openAdd(TODAY);
    });

    fillIn(editor);

    // When
    act(() => {
      editor.result.current.save();
    });

    // Then
    await waitFor(() => {
      expect(editor.result.current.editing).toBeNull();
    });

    expect(api.callsTo(CREATE)[0]?.body).toEqual({
      name: 'Oddish',
      description: null,
      tags: [],
      summerIntervalDays: 5,
      winterIntervalDays: 10,
      lastWateredOn: '2026-11-20',
    });
  });

  it('should save the changes of the plant and close when they are saved', async () => {
    // Given
    const api = fakeApi({ [EDIT]: { status: 204 } });
    const editor = renderEditor();

    act(() => {
      editor.result.current.openEdit(FERN, TODAY);
    });

    act(() => {
      editor.result.current.change('winterIntervalDays', '21');
    });

    // When
    act(() => {
      editor.result.current.save();
    });

    // Then
    await waitFor(() => {
      expect(editor.result.current.editing).toBeNull();
    });

    expect(api.callsTo(EDIT)[0]?.body).toEqual({
      name: "Bulbasaur's fern",
      description: null,
      tags: [],
      summerIntervalDays: 7,
      winterIntervalDays: 21,
      nextWateringOn: '2026-11-17',
    });
  });

  it('should stay open and say saving failed when the server refuses, until the form opens again', async () => {
    // Given
    fakeApi({ [CREATE]: status(400) });
    const editor = renderEditor();

    act(() => {
      editor.result.current.openAdd(TODAY);
    });

    fillIn(editor);

    // When
    act(() => {
      editor.result.current.save();
    });

    // Then
    await waitFor(() => {
      expect(editor.result.current.failed).toBe(true);
    });

    expect(editor.result.current.editing).not.toBeNull();

    // When
    act(() => {
      editor.result.current.openAdd(TODAY);
    });

    // Then
    await waitFor(() => {
      expect(editor.result.current.failed).toBe(false);
    });
  });

  it('should add and remove tags, with a note that clears on typing', () => {
    // Given
    const editor = renderEditor();

    act(() => {
      editor.result.current.openAdd(TODAY);
      editor.result.current.change('tagDraft', 'Shade');
    });

    // When
    act(() => {
      editor.result.current.addTag();
      editor.result.current.change('tagDraft', 'shade');
      editor.result.current.addTag();
    });

    // Then
    expect(editor.result.current.editing?.values.tags).toEqual(['Shade']);
    expect(editor.result.current.editing?.tagNote).toBe('tagDuplicate');

    // When
    act(() => {
      editor.result.current.change('tagDraft', 'S');
    });

    // Then
    expect(editor.result.current.editing?.tagNote).toBeNull();

    // When
    act(() => {
      editor.result.current.removeTag('Shade');
    });

    // Then
    expect(editor.result.current.editing?.values.tags).toEqual([]);
  });

  it('should close without saving', () => {
    // Given
    const api = fakeApi({});
    const editor = renderEditor();

    act(() => {
      editor.result.current.openAdd(TODAY);
    });

    // When
    act(() => {
      editor.result.current.close();
    });

    // Then
    expect(editor.result.current.editing).toBeNull();
    expect(api.calls).toHaveLength(0);
  });
});
