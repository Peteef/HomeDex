import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { PlantFormProps } from '../PlantForm.tsx';
import { PlantForm } from '../PlantForm.tsx';

const VALUES = {
  name: "Bulbasaur's fern",
  description: 'Likes shade.',
  tags: ['Shade'],
  tagDraft: '',
  summerIntervalDays: '7',
  winterIntervalDays: '14',
};

const renderForm = (props: Partial<PlantFormProps> = {}) => {
  const handlers = {
    onChange: vi.fn(),
    onAddTag: vi.fn(),
    onRemoveTag: vi.fn(),
    onSubmit: vi.fn(),
  };

  render(
    <PlantForm
      values={VALUES}
      errors={{}}
      tagNote={null}
      tagSuggestions={[]}
      dateField={<input aria-label="Watering date" />}
      saving={false}
      failed={false}
      {...handlers}
      {...props}
    />,
  );

  return handlers;
};

const field = (name: string) => screen.getByLabelText(name);

describe('PlantForm', () => {
  it('should show the values in their fields', () => {
    // When
    renderForm();

    // Then
    expect(field('Name')).toHaveValue("Bulbasaur's fern");
    expect(field('Description')).toHaveValue('Likes shade.');
    expect(screen.getByRole('button', { name: 'Remove Shade' })).toBeInTheDocument();
    expect(field('Summer')).toHaveValue(7);
    expect(field('Winter')).toHaveValue(14);
  });

  it('should show the date field it is given', () => {
    // When
    renderForm();

    // Then
    expect(field('Watering date')).toBeInTheDocument();
  });

  it('should ask for the intervals as whole days in a group', () => {
    // When
    renderForm();

    // Then
    expect(screen.getByRole('group', { name: 'Water every' })).toBeInTheDocument();
    expect(field('Summer')).toHaveAttribute('min', '1');
    expect(field('Summer')).toHaveAttribute('max', '365');
    expect(field('Winter')).toHaveAttribute('step', '1');
  });

  it.each([
    ['Name', 'name', 'Oddish'],
    ['Description', 'description', 'Sunny spot.'],
    ['Summer', 'summerIntervalDays', '5'],
    ['Winter', 'winterIntervalDays', '10'],
  ])('should pass on a change of %s', (label, name, value) => {
    // Given
    const { onChange } = renderForm();

    // When
    fireEvent.change(field(label), { target: { value } });

    // Then
    expect(onChange).toHaveBeenCalledWith(name, value);
  });

  it('should pass on what is typed as a new tag', () => {
    // Given
    const { onChange } = renderForm();

    // When
    fireEvent.change(field('New tag'), { target: { value: 'Living room' } });

    // Then
    expect(onChange).toHaveBeenCalledWith('tagDraft', 'Living room');
  });

  it('should show each error next to its field', () => {
    // When
    renderForm({
      errors: {
        name: 'nameRequired',
        description: 'descriptionTooLong',
        summerIntervalDays: 'intervalInvalid',
      },
    });

    // Then
    expect(field('Name')).toHaveAccessibleDescription('Enter a name.');
    expect(field('Description')).toHaveAccessibleDescription('Use at most 1000 characters.');
    expect(field('Summer')).toHaveAccessibleDescription('Enter whole days from 1 to 365.');
    expect(field('Winter')).toBeValid();
  });

  it('should limit the length of the name and the description', () => {
    // When
    renderForm();

    // Then
    expect(field('Name')).toHaveAttribute('maxlength', '60');
    expect(field('Description')).toHaveAttribute('maxlength', '1000');
  });

  it('should submit', () => {
    // Given
    const { onSubmit } = renderForm();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    // Then
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('should disable saving while saving', () => {
    // When
    renderForm({ saving: true });

    // Then
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });

  it('should say so when saving failed', () => {
    // When
    renderForm({ failed: true });

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent("Can't save the plant. Try again.");
  });

  it('should show its text in Polish', async () => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    renderForm({ errors: { name: 'nameRequired' } });

    // Then
    expect(field('Nazwa')).toHaveAccessibleDescription('Wpisz nazwę.');
    expect(screen.getByRole('group', { name: 'Podlewanie co' })).toBeInTheDocument();
  });
});
