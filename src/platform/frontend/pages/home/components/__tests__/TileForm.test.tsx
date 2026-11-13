import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TileForm } from '../TileForm.tsx';
import type { TileFormProps } from '../TileForm.tsx';

const renderForm = (props: Partial<TileFormProps> = {}) => {
  const all: TileFormProps = {
    values: {
      texts: [{ language: 'en', title: 'Finances', description: '' }],
      url: 'https://docs.example.com/budget',
      icon: 'wallet',
      scope: 'personal',
    },
    errors: { titles: {} },
    flags: { en: '🇬🇧', pl: '🇵🇱' },
    missingLanguages: ['pl'],
    scopeLocked: false,
    saving: false,
    onTextChange: vi.fn(),
    onAddLanguage: vi.fn(),
    onRemoveLanguage: vi.fn(),
    onUrlChange: vi.fn(),
    onIconChange: vi.fn(),
    onScopeChange: vi.fn(),
    onSubmit: vi.fn(),
    ...props,
  };

  render(<TileForm {...all} />);
  return all;
};

describe('TileForm', () => {
  it('should offer to add each missing language', () => {
    // Given
    const { onAddLanguage } = renderForm();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Add PL' }));

    // Then
    expect(onAddLanguage).toHaveBeenCalledWith('pl');
  });

  it('should show a block per language, each removable when there are several', () => {
    // When
    renderForm({
      values: {
        texts: [
          { language: 'en', title: 'Finances', description: '' },
          { language: 'pl', title: 'Finanse', description: '' },
        ],
        url: '',
        icon: 'link',
        scope: 'personal',
      },
      missingLanguages: [],
    });

    // Then
    expect(screen.getByRole('group', { name: '🇬🇧 EN' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '🇵🇱 PL' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Remove/ })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /^Add/ })).not.toBeInTheDocument();
  });

  it('should report a changed address', () => {
    // Given
    const { onUrlChange } = renderForm();

    // When
    fireEvent.change(screen.getByRole('textbox', { name: 'Address' }), {
      target: { value: 'http://192.168.1.10:8123' },
    });

    // Then
    expect(onUrlChange).toHaveBeenCalledWith('http://192.168.1.10:8123');
  });

  it('should show the field errors', () => {
    // When
    renderForm({ errors: { titles: { en: 'titleRequired' }, url: 'urlInvalid' } });

    // Then
    expect(screen.getByText('Enter a title.')).toBeInTheDocument();

    expect(
      screen.getByText('Enter a web address starting with http:// or https://.'),
    ).toBeInTheDocument();
  });

  it('should submit through onSubmit', () => {
    // Given
    const { onSubmit } = renderForm();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    // Then
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('should disable saving while a save is on its way', () => {
    // When
    renderForm({ saving: true });

    // Then
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });

  it('should show why the last save failed', () => {
    // When
    renderForm({ failure: 'gone' });

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent(
      "This tile was removed or can't be changed anymore.",
    );
  });

  it('should offer delete only when editing', () => {
    // When
    renderForm({ deletion: { title: 'Finances', deleting: false, onDelete: vi.fn() } });

    // Then
    expect(screen.getByRole('button', { name: 'Delete tile' })).toBeInTheDocument();
  });

  it('should not offer delete when adding', () => {
    // When
    renderForm();

    // Then
    expect(screen.queryByRole('button', { name: 'Delete tile' })).not.toBeInTheDocument();
  });
});
