import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Panel } from '../Panel.tsx';

describe('Panel', () => {
  it('should render its children', () => {
    // When
    render(<Panel>Hello</Panel>);

    // Then
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should add the given class names to its own', () => {
    // When
    render(<Panel className="gap-3">Hello</Panel>);

    // Then
    expect(screen.getByText('Hello')).toHaveClass('gap-3', 'w-full');
  });
});
