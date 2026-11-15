import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessagePanel } from '../MessagePanel.tsx';

describe('MessagePanel', () => {
  it('should show the title as the page heading', () => {
    // When
    render(<MessagePanel title="Gone fishing" message="Back soon." />);

    // Then
    expect(screen.getByRole('heading', { level: 1, name: 'Gone fishing' })).toBeInTheDocument();
  });

  it('should show the message', () => {
    // When
    render(<MessagePanel title="Gone fishing" message="Back soon." />);

    // Then
    expect(screen.getByText('Back soon.')).toBeInTheDocument();
  });

  it('should show its children below the message', () => {
    // When
    render(
      <MessagePanel title="Gone fishing" message="Back soon.">
        <button type="button">Wait</button>
      </MessagePanel>,
    );

    // Then
    expect(screen.getByRole('button', { name: 'Wait' })).toBeInTheDocument();
  });
});
