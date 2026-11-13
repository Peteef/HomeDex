import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconPicker } from '../IconPicker.tsx';

describe('IconPicker', () => {
  it('should offer every icon by name and check the current one', () => {
    // When
    render(<IconPicker value="wallet" onChange={vi.fn()} />);

    // Then
    expect(screen.getAllByRole('radio')).toHaveLength(20);
    expect(screen.getByRole('radio', { name: 'Wallet' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Cart' })).not.toBeChecked();
  });

  it('should report the picked icon', () => {
    // Given
    const onChange = vi.fn();
    render(<IconPicker value="wallet" onChange={onChange} />);

    // When
    fireEvent.click(screen.getByRole('radio', { name: 'Cart' }));

    // Then
    expect(onChange).toHaveBeenCalledWith('cart');
  });
});
