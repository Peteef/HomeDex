import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageFields } from '../LanguageFields.tsx';
import type { LanguageFieldsProps } from '../LanguageFields.tsx';

const renderFields = (props: Partial<LanguageFieldsProps> = {}) => {
  const all: LanguageFieldsProps = {
    text: { language: 'pl', title: 'Finanse', description: '' },
    flag: '🇵🇱',
    removable: false,
    onChange: vi.fn(),
    onRemove: vi.fn(),
    ...props,
  };

  render(<LanguageFields {...all} />);
  return all;
};

describe('LanguageFields', () => {
  it('should name the group by its flag and language code', () => {
    // When
    renderFields();

    // Then
    expect(screen.getByRole('group', { name: '🇵🇱 PL' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Finanse');
  });

  it('should report a changed title and description with the language', () => {
    // Given
    const { onChange } = renderFields();

    // When
    fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Budżet' },
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Description (optional)' }), {
      target: { value: 'Co miesiąc' },
    });

    // Then
    expect(onChange).toHaveBeenNthCalledWith(1, {
      language: 'pl',
      title: 'Budżet',
      description: '',
    });

    expect(onChange).toHaveBeenNthCalledWith(2, {
      language: 'pl',
      title: 'Finanse',
      description: 'Co miesiąc',
    });
  });

  it('should limit the title and the description to what the API accepts', () => {
    // When
    renderFields();

    // Then
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveAttribute('maxlength', '60');

    expect(screen.getByRole('textbox', { name: 'Description (optional)' })).toHaveAttribute(
      'maxlength',
      '140',
    );
  });

  it('should show a title error', () => {
    // When
    renderFields({ error: 'titleRequired' });

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a title.');
  });

  it('should offer remove only when removable', () => {
    // Given
    const { onRemove } = renderFields({ removable: true });

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Remove PL' }));

    // Then
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('should not offer remove for the last language', () => {
    // When
    renderFields({ removable: false });

    // Then
    expect(screen.queryByRole('button', { name: 'Remove PL' })).not.toBeInTheDocument();
  });
});
