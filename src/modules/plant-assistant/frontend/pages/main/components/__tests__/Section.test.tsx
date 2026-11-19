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
});
