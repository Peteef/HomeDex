import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import { ItemRow } from '../ItemRow.tsx';
import type { Item } from '../../../../features/items/index.ts';

const MILK: Item = {
  id: 1,
  text: 'Milk',
  amount: '2 l',
  addedBy: 'Misty',
  checked: false,
};

const renderRow = (changes: Partial<Item> = {}) => {
  const props = {
    item: { ...MILK, ...changes },
    onToggle: vi.fn(),
    onDelete: vi.fn(),
  };

  render(
    <ul>
      <ItemRow {...props} />
    </ul>,
  );

  return props;
};

describe('ItemRow', () => {
  it('should show the item, its amount and who added it', () => {
    // When
    renderRow();

    // Then
    expect(screen.getByRole('checkbox', { name: /^Milk/ })).not.toBeChecked();
    expect(screen.getByText('· 2 l')).toBeInTheDocument();
    expect(screen.getByText('Added by Misty')).toBeInTheDocument();
  });

  it('should show an item without an amount', () => {
    // When
    renderRow({ amount: null });

    // Then
    expect(screen.getByRole('checkbox', { name: 'MilkAdded by Misty' })).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it('should show a checked item as checked', () => {
    // When
    renderRow({ checked: true });

    // Then
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should ask to toggle the item when the row is tapped', () => {
    // Given
    const { onToggle } = renderRow();

    // When
    fireEvent.click(screen.getByText('Added by Misty'));

    // Then
    expect(onToggle).toHaveBeenCalledWith(MILK);
  });

  it('should ask to delete the item', () => {
    // Given
    const { onDelete, onToggle } = renderRow();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Delete Milk' }));

    // Then
    expect(onDelete).toHaveBeenCalledWith(MILK);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('should show its text in Polish', async () => {
    // Given
    renderRow();

    // When
    await act(() => i18next.changeLanguage('pl'));

    // Then
    expect(screen.getByText('Dodane przez: Misty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuń: Milk' })).toBeInTheDocument();
  });
});
