import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Item } from '../../../../features/items/index.ts';
import { ItemList } from '../ItemList.tsx';
import type { ItemListProps } from '../ItemList.tsx';

const MILK: Item = { id: 1, text: 'Milk', amount: '2 l', addedBy: 'Ash', checked: false };
const BREAD: Item = { id: 2, text: 'Bread', amount: null, addedBy: 'Misty', checked: true };

const renderList = (overrides: Partial<ItemListProps> = {}) => {
  const props: ItemListProps = {
    items: [MILK, BREAD],
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    onClearChecked: vi.fn(),
    ...overrides,
  };

  render(<ItemList {...props} />);
  return props;
};

const section = (name: string) => within(screen.getByRole('region', { name }));

describe('ItemList', () => {
  it('should show unchecked items under To buy and checked ones under In the cart', () => {
    // When
    renderList();

    // Then
    expect(section('To buy').getByRole('checkbox', { name: /^Milk/ })).not.toBeChecked();
    expect(section('In the cart').getByRole('checkbox', { name: /^Bread/ })).toBeChecked();
  });

  it('should say there is nothing to buy when nothing is unchecked', () => {
    // When
    renderList({ items: [BREAD] });

    // Then
    expect(section('To buy').getByRole('status')).toHaveTextContent(
      'Nothing to buy. Add the first item above.',
    );
  });

  it('should hide the In the cart section and the Clear button when nothing is checked', () => {
    // When
    renderList({ items: [MILK] });

    // Then
    expect(screen.queryByRole('region', { name: 'In the cart' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('should call onToggle with the item when its checkbox is pressed', () => {
    // Given
    const { onToggle } = renderList();

    // When
    fireEvent.click(screen.getByRole('checkbox', { name: /^Milk/ }));

    // Then
    expect(onToggle).toHaveBeenCalledWith({
      id: 1,
      text: 'Milk',
      amount: '2 l',
      addedBy: 'Ash',
      checked: false,
    });
  });

  it('should call onDelete with the item when Delete Milk is pressed', () => {
    // Given
    const { onDelete } = renderList();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Delete Milk' }));

    // Then
    expect(onDelete).toHaveBeenCalledWith({
      id: 1,
      text: 'Milk',
      amount: '2 l',
      addedBy: 'Ash',
      checked: false,
    });
  });

  it('should call onClearChecked when Clear is pressed', () => {
    // Given
    const { onClearChecked } = renderList();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    // Then
    expect(onClearChecked).toHaveBeenCalledOnce();
  });
});
