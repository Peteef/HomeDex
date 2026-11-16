import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { HomeLink } from '../HomeLink.tsx';

describe('HomeLink', () => {
  it('should link to the given path with its children as the name', () => {
    // When
    render(
      <MemoryRouter>
        <HomeLink to="/dex">Back home</HomeLink>
      </MemoryRouter>,
    );

    // Then
    expect(screen.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/dex');
  });
});
