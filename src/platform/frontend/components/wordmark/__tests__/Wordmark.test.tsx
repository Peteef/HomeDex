import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Wordmark } from '../Wordmark.tsx';

describe('Wordmark', () => {
  it('should show the brand name when it is shown', () => {
    // When
    render(<Wordmark />);

    // Then
    expect(screen.getByText('HOMEDEX')).toBeInTheDocument();
  });
});
