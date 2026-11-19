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
    const section = screen.getByRole('region', { name: 'All plants' });
    expect(section).toHaveTextContent('Monstera');
  });

  it('should keep the heading for screen readers only when it is hidden', () => {
    // When
    render(<Section heading="All plants" hideHeading />);

    // Then
    const heading = screen.getByRole('heading', { level: 2, name: 'All plants' });
    expect(heading).toHaveClass('sr-only');
    expect(screen.getByRole('region', { name: 'All plants' })).toBeInTheDocument();
  });
});
