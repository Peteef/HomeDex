import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { TextLink } from '../TextLink.tsx';

describe('TextLink', () => {
  it('should link to the given path with its children as the name', () => {
    // When
    render(
      <MemoryRouter>
        <TextLink to="/dex">Back home</TextLink>
      </MemoryRouter>,
    );

    // Then
    expect(screen.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/dex');
  });
});
