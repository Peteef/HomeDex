import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { PhotoFieldProps } from '../PhotoField.tsx';
import { PhotoField } from '../PhotoField.tsx';

const renderField = (props: Partial<PhotoFieldProps> = {}) => {
  const handlers = { onChoose: vi.fn(), onRemove: vi.fn() };
  render(<PhotoField photoUrl="/fern.jpg" unreadable={false} {...handlers} {...props} />);
  return handlers;
};

const chooser = () => screen.getByLabelText('Choose photo');

describe('PhotoField', () => {
  it('should show the photo and offer to choose another or remove it', () => {
    // When
    renderField();

    // Then
    expect(document.querySelector('img')).toHaveAttribute('src', '/fern.jpg');
    expect(chooser()).toHaveAttribute('accept', 'image/*');
    expect(screen.getByRole('button', { name: 'Remove photo' })).toBeInTheDocument();
  });

  it('should show the placeholder and offer no removal without a photo', () => {
    // When
    renderField({ photoUrl: null });

    // Then
    expect(document.querySelector('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove photo' })).not.toBeInTheDocument();
  });

  it('should pass on the chosen file', () => {
    // Given
    const { onChoose } = renderField();
    const file = new File(['photo'], 'fern.png', { type: 'image/png' });

    // When
    fireEvent.change(chooser(), { target: { files: [file] } });

    // Then
    expect(onChoose).toHaveBeenCalledWith(file);
  });

  it('should do nothing when the choice is cancelled', () => {
    // Given
    const { onChoose } = renderField();

    // When
    fireEvent.change(chooser(), { target: { files: [] } });

    // Then
    expect(onChoose).not.toHaveBeenCalled();
  });

  it('should remove the photo', () => {
    // Given
    const { onRemove } = renderField();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }));

    // Then
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('should say when the photo cannot be read', () => {
    // When
    renderField({ unreadable: true });

    // Then
    expect(chooser()).toHaveAccessibleDescription("This photo can't be read. Try a JPEG or PNG.");
  });

  it('should show its text in Polish', async () => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    renderField();

    // Then
    expect(screen.getByLabelText('Wybierz zdjęcie')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuń zdjęcie' })).toBeInTheDocument();
  });
});
