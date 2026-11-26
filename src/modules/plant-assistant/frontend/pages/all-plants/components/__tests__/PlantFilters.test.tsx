import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import { PlantFilters } from '../PlantFilters.tsx';

describe('PlantFilters', () => {
  it('should show the search', () => {
    // When
    render(<PlantFilters query="fern" tag={null} onQueryChange={vi.fn()} onClearTag={vi.fn()} />);

    // Then
    const search = screen.getByRole('searchbox', { name: 'Search plants' });
    expect(search).toHaveValue('fern');
    expect(search).toHaveAttribute('enterkeyhint', 'search');
  });

  it('should pass on what is typed', () => {
    // Given
    const onQueryChange = vi.fn();
    render(<PlantFilters query="" tag={null} onQueryChange={onQueryChange} onClearTag={vi.fn()} />);

    // When
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zolw' } });

    // Then
    expect(onQueryChange).toHaveBeenCalledWith('zolw');
  });

  it('should show no tag filter when there is none', () => {
    // When
    render(<PlantFilters query="" tag={null} onQueryChange={vi.fn()} onClearTag={vi.fn()} />);

    // Then
    expect(screen.queryByText('Tag:')).not.toBeInTheDocument();
  });

  it('should show the tag filter and clear it', () => {
    // Given
    const onClearTag = vi.fn();
    render(<PlantFilters query="" tag="Shade" onQueryChange={vi.fn()} onClearTag={onClearTag} />);
    expect(screen.getByText('Tag:')).toBeInTheDocument();
    expect(screen.getByText('Shade')).toBeInTheDocument();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Clear the tag filter' }));

    // Then
    expect(onClearTag).toHaveBeenCalledOnce();
  });

  it('should show its text in Polish', async () => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    render(<PlantFilters query="" tag="Cień" onQueryChange={vi.fn()} onClearTag={vi.fn()} />);

    // Then
    expect(screen.getByRole('searchbox', { name: 'Szukaj roślin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wyczyść filtr tagu' })).toBeInTheDocument();
  });
});
