import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccountTiles } from '../AccountTiles.tsx';

describe('AccountTiles', () => {
  it('should show a button per account with its name and first letter when there are accounts', () => {
    // When
    render(<AccountTiles usernames={['Brock', 'Misty']} onPick={vi.fn()} />);

    // Then
    const brock = screen.getByRole('button', { name: 'Brock' });
    expect(within(brock).getByText('B')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('should call onPick with the username when an account is pressed', () => {
    // Given
    const onPick = vi.fn();
    render(<AccountTiles usernames={['Brock', 'Misty']} onPick={onPick} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Misty' }));

    // Then
    expect(onPick).toHaveBeenCalledWith('Misty');
  });

  it('should explain how to create an account when there are none', () => {
    // When
    const { container } = render(<AccountTiles usernames={[]} onPick={vi.fn()} />);

    // Then
    expect(container).toHaveTextContent('No Trainers yet');
    expect(container.querySelector('code')).toHaveTextContent('npm run users -- create');
  });
});
