import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { AddPlantFormProps } from '../AddPlantForm.tsx';
import { AddPlantForm } from '../AddPlantForm.tsx';

const VALUES = {
  name: "Bulbasaur's fern",
  description: '',
  tags: [],
  tagDraft: '',
  summerIntervalDays: '7',
  winterIntervalDays: '14',
  lastWateredOn: '2026-11-20',
};

const renderForm = (props: Partial<AddPlantFormProps> = {}) => {
  const onChange = vi.fn();

  render(
    <AddPlantForm
      values={VALUES}
      errors={{}}
      tagNote={null}
      tagSuggestions={[]}
      dateLimits={{ max: '2026-11-20' }}
      saving={false}
      failed={false}
      onChange={onChange}
      onAddTag={vi.fn()}
      onRemoveTag={vi.fn()}
      onSubmit={vi.fn()}
      {...props}
    />,
  );

  return onChange;
};

const field = (name: string) => screen.getByLabelText(name);

describe('AddPlantForm', () => {
  it('should show the fields every plant has', () => {
    // When
    renderForm();

    // Then
    expect(field('Name')).toHaveValue("Bulbasaur's fern");
    expect(screen.getByRole('group', { name: 'Water every' })).toBeInTheDocument();
  });

  it('should ask for the last watered within its limits', () => {
    // When
    renderForm();

    // Then
    expect(field('Last watered')).toHaveAttribute('type', 'date');
    expect(field('Last watered')).toHaveValue('2026-11-20');
    expect(field('Last watered')).toHaveAttribute(...['max', '2026-11-20']);
    expect(screen.queryByLabelText('Next watering')).not.toBeInTheDocument();
  });

  it('should pass on a change of the last watered', () => {
    // Given
    const onChange = renderForm();

    // When
    fireEvent.change(field('Last watered'), { target: { value: '2026-11-18' } });

    // Then
    expect(onChange).toHaveBeenCalledWith('lastWateredOn', '2026-11-18');
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
    renderForm({ errors: { name: 'nameRequired', lastWateredOn: 'dateInFuture' } });

    // Then
    expect(field('Name')).toHaveAccessibleDescription('Enter a name.');
    expect(field('Last watered')).toHaveAccessibleDescription("This date can't be in the future.");
  });

  it('should show its text in Polish', async () => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    renderForm();

    // Then
    expect(field('Ostatnie podlewanie')).toBeInTheDocument();
  });
});
