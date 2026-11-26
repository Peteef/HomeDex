import { fakeApi, status, withProviders } from '#platform/frontend/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useAddPlantForm } from '../useAddPlantForm.ts';

const CREATE = 'POST /api/m/plant-assistant/plants';
const TODAY = '2026-11-20';

const CREATED = {
  id: 1,
  name: 'Oddish',
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-20',
  nextWateringOn: '2026-11-30',
  daysUntil: 10,
  urgency: 'later',
  summerIntervalDays: 5,
  winterIntervalDays: 10,
  currentSeason: 'winter',
};

const wrapper = ({ children }: { children: ReactNode }) => withProviders(children);

const renderForm = () => renderHook(() => useAddPlantForm(), { wrapper });

type Form = ReturnType<typeof renderForm>;

const openAndFillIn = (form: Form) => {
  act(() => {
    form.result.current.open(TODAY);
  });

  act(() => {
    form.result.current.change('name', '  Oddish ');
    form.result.current.change('summerIntervalDays', '5');
    form.result.current.change('winterIntervalDays', '10');
  });
};

describe('useAddPlantForm', () => {
  it('should be closed at first, with no date limits', () => {
    // When
    const { result } = renderForm();

    // Then
    expect(result.current.form).toBeNull();
    expect(result.current.dateLimits).toEqual({});
  });

  it('should open empty, last watered today and not after', () => {
    // Given
    const form = renderForm();

    // When
    act(() => {
      form.result.current.open(TODAY);
    });

    // Then
    expect(form.result.current.form?.values.lastWateredOn).toBe('2026-11-20');
    expect(form.result.current.form?.values.name).toBe('');
    expect(form.result.current.dateLimits).toEqual({ max: '2026-11-20' });
  });

  it('should create the plant from the trimmed values and close when it is saved', async () => {
    // Given
    const api = fakeApi({ [CREATE]: { status: 201, body: { plant: CREATED } } });
    const form = renderForm();
    openAndFillIn(form);

    // When
    act(() => {
      form.result.current.save();
    });

    // Then
    await waitFor(() => {
      expect(form.result.current.form).toBeNull();
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

  it('should send nothing while the values are invalid', () => {
    // Given
    const api = fakeApi({});
    const form = renderForm();

    act(() => {
      form.result.current.open(TODAY);
    });

    // When
    act(() => {
      form.result.current.save();
    });

    // Then
    expect(form.result.current.errors.name).toBe('nameRequired');
    expect(api.calls).toHaveLength(0);
  });

  it('should stay open and say saving failed when the server refuses, until it opens again', async () => {
    // Given
    fakeApi({ [CREATE]: status(400) });
    const form = renderForm();
    openAndFillIn(form);

    // When
    act(() => {
      form.result.current.save();
    });

    // Then
    await waitFor(() => {
      expect(form.result.current.failed).toBe(true);
    });

    expect(form.result.current.form).not.toBeNull();

    // When
    act(() => {
      form.result.current.open(TODAY);
    });

    // Then
    await waitFor(() => {
      expect(form.result.current.failed).toBe(false);
    });
  });
});
