import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageSelect } from '../LanguageSelect.tsx';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'pl', name: 'Polski' },
  { code: 'de', name: 'Deutsch' },
] as const;

describe('LanguageSelect', () => {
  it('should offer every language by its own name', () => {
    // When
    render(<LanguageSelect languages={LANGUAGES} value="en" onChange={vi.fn()} />);

    // Then
    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['English', 'Polski', 'Deutsch']);
    expect(screen.getByRole('option', { name: 'Polski' })).toHaveAttribute('lang', 'pl');
  });

  it('should show the current language', () => {
    // When
    render(<LanguageSelect languages={LANGUAGES} value="pl" onChange={vi.fn()} />);

    // Then
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue('pl');
  });

  it('should report the language the user picks', () => {
    // Given
    const onChange = vi.fn();
    render(<LanguageSelect languages={LANGUAGES} value="en" onChange={onChange} />);

    // When
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), {
      target: { value: 'de' },
    });

    // Then
    expect(onChange).toHaveBeenCalledWith('de');
  });
});
