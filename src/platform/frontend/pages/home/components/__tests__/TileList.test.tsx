import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { TileList } from '../TileList.tsx';
import type { TileEntry, TileListProps } from '../TileList.tsx';

const FINANCES: TileEntry = {
  id: 1,
  dexNo: 1,
  icon: 'wallet',
  title: 'Finances',
  href: 'https://docs.example.com/budget',
  external: true,
  pinned: false,
  editable: true,
};

const CLOCK: TileEntry = {
  id: 2,
  dexNo: 2,
  icon: 'calendar',
  title: 'Clock',
  href: '/m/clock',
  pinned: false,
  editable: false,
};

const renderList = (props: Partial<TileListProps> = {}) => {
  const all: TileListProps = {
    entries: [FINANCES, CLOCK],
    failed: false,
    query: '',
    onRetry: vi.fn(),
    onTogglePin: vi.fn(),
    onEdit: vi.fn(),
    onAdd: vi.fn(),
    ...props,
  };

  render(
    <MemoryRouter>
      <TileList {...all} />
    </MemoryRouter>,
  );

  return all;
};

describe('TileList', () => {
  it('should say when the tiles cannot be loaded and offer a retry', () => {
    // Given
    const { onRetry } = renderList({ failed: true });

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent("Can't load the tiles.");
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should show the loading state while there are no entries yet', () => {
    // When
    renderList({ entries: undefined });

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('should show the tiles followed by the add tile', () => {
    // When
    renderList();

    // Then
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Add tile' })).toBeInTheDocument();
  });

  it('should offer the add tile in an empty Dex', () => {
    // Given
    const { onAdd } = renderList({ entries: [] });

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Add tile' }));

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('Your Dex is empty.');
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('should hide the add tile while searching', () => {
    // When
    renderList({ entries: [FINANCES], query: 'fin' });

    // Then
    expect(screen.queryByRole('button', { name: 'Add tile' })).not.toBeInTheDocument();
  });

  it('should say when nothing matches the search', () => {
    // When
    renderList({ entries: [], query: 'xyz' });

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('No tiles match “xyz”.');
  });

  it('should offer edit only on editable tiles', () => {
    // Given
    const { onEdit } = renderList();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Edit Finances' }));

    // Then
    expect(onEdit).toHaveBeenCalledWith(FINANCES);
    expect(screen.queryByRole('button', { name: 'Edit Clock' })).not.toBeInTheDocument();
  });

  it('should explain the long press when a tile can be edited', () => {
    // When
    renderList();

    // Then
    expect(screen.getByText('Hold a tile to edit it.')).toBeInTheDocument();
  });

  it('should not explain the long press when no tile can be edited', () => {
    // When
    renderList({ entries: [CLOCK] });

    // Then
    expect(screen.queryByText('Hold a tile to edit it.')).not.toBeInTheDocument();
  });

  it('should report the tile whose pin was toggled', () => {
    // Given
    const { onTogglePin } = renderList();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Pin Clock' }));

    // Then
    expect(onTogglePin).toHaveBeenCalledWith(CLOCK);
  });
});
