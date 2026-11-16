import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccountPicker } from '../AccountPicker.tsx';
import type { AccountPickerProps } from '../AccountPicker.tsx';

const renderPicker = (props: Partial<AccountPickerProps> = {}) =>
  render(
    <AccountPicker
      usernames={['Brock', 'Misty']}
      failed={false}
      onRetry={vi.fn()}
      onPick={vi.fn()}
      {...props}
    />,
  );

describe('AccountPicker', () => {
  it('should ask who is there when the picker opens', () => {
    // When
    renderPicker();

    // Then
    expect(
      screen.getByRole('heading', { level: 1, name: "Who's there, Trainer?" }),
    ).toBeInTheDocument();
  });

  it('should show the loading status when the accounts are not loaded yet', () => {
    // When
    renderPicker({ usernames: undefined });

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('should show the accounts when they are loaded', () => {
    // When
    renderPicker();

    // Then
    expect(screen.getByRole('button', { name: 'Brock' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Misty' })).toBeInTheDocument();
  });

  it('should explain the failure when loading failed', () => {
    // When
    renderPicker({ usernames: undefined, failed: true });

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent("Can't load the Trainers.");
  });

  it('should call onRetry when Try again is pressed after loading failed', () => {
    // Given
    const onRetry = vi.fn();
    renderPicker({ usernames: undefined, failed: true, onRetry });

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
