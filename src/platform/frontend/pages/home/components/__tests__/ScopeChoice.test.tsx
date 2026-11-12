import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScopeChoice } from '../ScopeChoice.tsx';

describe('ScopeChoice', () => {
  it('should offer only me and shared, with the current one checked', () => {
    // When
    render(<ScopeChoice value="personal" locked={false} onChange={vi.fn()} />);

    // Then
    expect(screen.getByRole('group', { name: 'Who sees it' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Only me' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Shared' })).not.toBeChecked();
  });

  it('should report the picked scope', () => {
    // Given
    const onChange = vi.fn();
    render(<ScopeChoice value="personal" locked={false} onChange={onChange} />);

    // When
    fireEvent.click(screen.getByRole('radio', { name: 'Shared' }));

    // Then
    expect(onChange).toHaveBeenCalledWith('shared');
  });

  it('should only say the tile is shared when the scope is locked', () => {
    // When
    render(<ScopeChoice value="shared" locked onChange={vi.fn()} />);

    // Then
    expect(screen.getByText('Shared: everyone can see it.')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
