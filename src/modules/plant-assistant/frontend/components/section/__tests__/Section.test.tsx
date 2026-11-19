import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Section } from '../Section.tsx';

describe('Section', () => {
  it('should be a region named by its heading', () => {
    // When
    render(
      <Section heading="All plants">
        <p>Monstera</p>
      </Section>,
    );

    // Then
    expect(screen.getByRole('region', { name: 'All plants' })).toHaveTextContent('Monstera');
  });

  it('should keep the heading for screen readers only from lg', () => {
    // When
    render(<Section heading="All plants" />);

    // Then
    expect(screen.getByRole('heading', { level: 2, name: 'All plants' })).toHaveClass('lg:sr-only');
  });
});
