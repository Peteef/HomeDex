import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TagChip } from '../TagChip.tsx';

describe('TagChip', () => {
  it('should show the tag without a button', () => {
    // When
    render(<TagChip tag="Living room" />);

    // Then
    expect(screen.getByText('Living room')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
