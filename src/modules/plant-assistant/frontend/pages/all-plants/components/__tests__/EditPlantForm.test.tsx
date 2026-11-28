import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { EditPlantValues } from '../../types.ts';
import type { EditPlantFormProps } from '../EditPlantForm.tsx';
import { EditPlantForm } from '../EditPlantForm.tsx';

const VALUES: EditPlantValues = {
  name: "Bulbasaur's fern",
  description: '',
  tags: [],
  tagDraft: '',
  summerIntervalDays: '7',
  winterIntervalDays: '14',
  photo: { kind: 'keep' },
  nextWateringOn: '2026-11-17',
};

const renderForm = (props: Partial<EditPlantFormProps> = {}) => {
  const onChange = vi.fn();

  render(
    <EditPlantForm
      values={VALUES}
      errors={{}}
      tagNote={null}
      tagSuggestions={[]}
      photoUrl={null}
      photoUnreadable={false}
      dateLimits={{ min: '2026-11-20' }}
      saving={false}
      failed={false}
      onChange={onChange}
      onAddTag={vi.fn()}
      onRemoveTag={vi.fn()}
      onChoosePhoto={vi.fn()}
      onRemovePhoto={vi.fn()}
      onSubmit={vi.fn()}
      {...props}
    />,
  );

  return onChange;
};

const field = (name: string) => screen.getByLabelText(name);

describe('EditPlantForm', () => {
  it('should show the fields every plant has', () => {
    // When
    renderForm();

    // Then
    expect(field('Name')).toHaveValue("Bulbasaur's fern");
    expect(screen.getByRole('group', { name: 'Water every' })).toBeInTheDocument();
  });

  it('should ask for the next watering within its limits', () => {
    // When
    renderForm();

    // Then
    expect(field('Next watering')).toHaveAttribute('type', 'date');
    expect(field('Next watering')).toHaveValue('2026-11-17');
    expect(field('Next watering')).toHaveAttribute(...['min', '2026-11-20']);
    expect(screen.queryByLabelText('Last watered')).not.toBeInTheDocument();
  });

  it('should pass on a change of the next watering', () => {
    // Given
    const onChange = renderForm();

    // When
    fireEvent.change(field('Next watering'), { target: { value: '2026-11-25' } });

    // Then
    expect(onChange).toHaveBeenCalledWith('nextWateringOn', '2026-11-25');
  });

  it('should pass on a change of the other fields', () => {
    // Given
    const onChange = renderForm();

    // When
    fireEvent.change(field('Name'), { target: { value: 'Oddish' } });

    // Then
    expect(onChange).toHaveBeenCalledWith('name', 'Oddish');
  });

  it('should show the errors next to their fields', () => {
    // When
    renderForm({ errors: { name: 'nameRequired', nextWateringOn: 'dateInPast' } });

    // Then
    expect(field('Name')).toHaveAccessibleDescription('Enter a name.');
    expect(field('Next watering')).toHaveAccessibleDescription('Choose today or a later date.');
  });

  it('should show its text in Polish', async () => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    renderForm();

    // Then
    expect(field('Następne podlewanie')).toBeInTheDocument();
  });
});
