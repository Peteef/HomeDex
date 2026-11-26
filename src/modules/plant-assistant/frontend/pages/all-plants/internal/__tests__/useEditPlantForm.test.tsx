import { fakeApi, status, withProviders } from '#platform/frontend/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import type { PlantDetails } from '../../../../features/plants/index.ts';
import { useEditPlantForm } from '../useEditPlantForm.ts';

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

const renderForm = () => renderHook(() => useEditPlantForm(), { wrapper });

type Form = ReturnType<typeof renderForm>;

const openFern = (form: Form) => {
  act(() => {
    form.result.current.open(FERN, TODAY);
  });
};

describe('useEditPlantForm', () => {
  it('should be closed at first, with no date limits', () => {
    // When
    const { result } = renderForm();

    // Then
    expect(result.current.form).toBeNull();
    expect(result.current.dateLimits).toEqual({});
  });

  it('should open with the values of the plant and no limit on its unchanged next watering', () => {
    // Given
    const form = renderForm();

    // When
    openFern(form);

    // Then
    expect(form.result.current.form?.values.name).toBe("Bulbasaur's fern");
    expect(form.result.current.form?.values.nextWateringOn).toBe('2026-11-17');
    expect(form.result.current.form?.context.plant).toBe(FERN);
    expect(form.result.current.dateLimits).toEqual({});
  });

  it('should show the photo of the plant until it is removed', () => {
    // Given
    const form = renderForm();

    act(() => {
      form.result.current.open({ ...FERN, photoId: 4 }, TODAY);
    });

    expect(form.result.current.photoUrl).toBe('/api/m/plant-assistant/plants/1/photo?v=4');

    // When
    act(() => {
      form.result.current.removePhoto();
    });

    // Then
    expect(form.result.current.photoUrl).toBeNull();
  });

  it('should send null for a removed photo, and no photo when it is left as it is', async () => {
    // Given
    const api = fakeApi({ [EDIT]: { status: 204 } });
    const form = renderForm();

    act(() => {
      form.result.current.open({ ...FERN, photoId: 4 }, TODAY);
    });

    act(() => {
      form.result.current.save();
    });

    await waitFor(() => {
      expect(api.callsTo(EDIT)).toHaveLength(1);
    });

    act(() => {
      form.result.current.open({ ...FERN, photoId: 4 }, TODAY);
      form.result.current.removePhoto();
    });

    // When
    act(() => {
      form.result.current.save();
    });

    // Then
    await waitFor(() => {
      expect(api.callsTo(EDIT)).toHaveLength(2);
    });

    expect(api.callsTo(EDIT)[0]?.body).not.toHaveProperty('photo');
    expect(api.callsTo(EDIT)[1]?.body).toMatchObject({ photo: null });
  });

  it('should allow no next watering before today once it is changed', () => {
    // Given
    const form = renderForm();
    openFern(form);

    // When
    act(() => {
      form.result.current.change('nextWateringOn', '2026-11-25');
    });

    // Then
    expect(form.result.current.dateLimits).toEqual({ min: '2026-11-20' });
  });

  it('should save the changes of the plant and close when they are saved', async () => {
    // Given
    const api = fakeApi({ [EDIT]: { status: 204 } });
    const form = renderForm();
    openFern(form);

    act(() => {
      form.result.current.change('winterIntervalDays', '21');
    });

    // When
    act(() => {
      form.result.current.save();
    });

    // Then
    await waitFor(() => {
      expect(form.result.current.form).toBeNull();
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

  it('should stay open and say saving failed when the server refuses, until it opens again', async () => {
    // Given
    fakeApi({ [EDIT]: status(400) });
    const form = renderForm();
    openFern(form);

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
    openFern(form);

    // Then
    await waitFor(() => {
      expect(form.result.current.failed).toBe(false);
    });
  });
});
