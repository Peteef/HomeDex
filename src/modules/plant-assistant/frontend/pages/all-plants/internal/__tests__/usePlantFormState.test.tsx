import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AddPlantValues } from '../../types.ts';
import { newPlantValues, validateNewPlant } from '../addPlantForm.ts';
import { usePlantFormState } from '../usePlantFormState.ts';

const CONTEXT = { today: '2026-11-20' };

const renderState = () => renderHook(() => usePlantFormState(validateNewPlant));

type State = ReturnType<typeof renderState>;

const openEmpty = (state: State) => {
  act(() => {
    state.result.current.open(CONTEXT, newPlantValues('2026-11-20'));
  });
};

const fillIn = (state: State) => {
  act(() => {
    state.result.current.change('name', 'Oddish');
    state.result.current.change('summerIntervalDays', '5');
    state.result.current.change('winterIntervalDays', '10');
  });
};

describe('usePlantFormState', () => {
  it('should hold no form at first', () => {
    // When
    const { result } = renderState();

    // Then
    expect(result.current.form).toBeNull();
  });

  it('should open with the given context and values', () => {
    // Given
    const state = renderState();

    // When
    openEmpty(state);

    // Then
    expect(state.result.current.form).toEqual({
      context: { today: '2026-11-20' },
      values: newPlantValues('2026-11-20'),
      submitted: false,
      tagNote: null,
    });
  });

  it('should show errors only after a save attempt, and follow the changes from then on', () => {
    // Given
    const save = vi.fn();
    const state = renderState();
    openEmpty(state);

    expect(state.result.current.errors).toEqual({});

    // When
    act(() => {
      state.result.current.submit(save);
    });

    // Then
    expect(state.result.current.errors).toEqual({
      name: 'nameRequired',
      summerIntervalDays: 'intervalInvalid',
      winterIntervalDays: 'intervalInvalid',
    });

    expect(save).not.toHaveBeenCalled();

    // When
    act(() => {
      state.result.current.change('name', 'Oddish');
    });

    // Then
    expect(state.result.current.errors.name).toBeUndefined();
  });

  it('should save valid values with the context', () => {
    // Given
    const save = vi.fn();
    const state = renderState();
    openEmpty(state);
    fillIn(state);

    // When
    act(() => {
      state.result.current.submit(save);
    });

    // Then
    const expected: AddPlantValues = {
      ...newPlantValues('2026-11-20'),
      name: 'Oddish',
      summerIntervalDays: '5',
      winterIntervalDays: '10',
    };

    expect(save).toHaveBeenCalledWith(expected, { today: '2026-11-20' });
  });

  it('should add and remove tags, with a note that clears on typing', () => {
    // Given
    const state = renderState();
    openEmpty(state);

    act(() => {
      state.result.current.change('tagDraft', 'Shade');
    });

    // When
    act(() => {
      state.result.current.addTag();
      state.result.current.change('tagDraft', 'shade');
      state.result.current.addTag();
    });

    // Then
    expect(state.result.current.form?.values.tags).toEqual(['Shade']);
    expect(state.result.current.form?.tagNote).toBe('tagDuplicate');

    // When
    act(() => {
      state.result.current.change('tagDraft', 'S');
    });

    // Then
    expect(state.result.current.form?.tagNote).toBeNull();

    // When
    act(() => {
      state.result.current.removeTag('Shade');
    });

    // Then
    expect(state.result.current.form?.values.tags).toEqual([]);
  });

  it('should close', () => {
    // Given
    const state = renderState();
    openEmpty(state);

    // When
    act(() => {
      state.result.current.close();
    });

    // Then
    expect(state.result.current.form).toBeNull();
  });

  it('should do nothing on a save attempt while closed', () => {
    // Given
    const save = vi.fn();
    const state = renderState();

    // When
    act(() => {
      state.result.current.submit(save);
    });

    // Then
    expect(save).not.toHaveBeenCalled();
    expect(state.result.current.form).toBeNull();
  });
});
