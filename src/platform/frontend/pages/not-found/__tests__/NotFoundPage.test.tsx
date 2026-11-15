import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { withProviders } from '../../../__tests__/helpers.tsx';
import { NotFoundPage } from '../NotFoundPage.tsx';

describe('NotFoundPage', () => {
  it('should say the page was not found', () => {
    // When
    render(withProviders(<NotFoundPage />));

    // Then
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('There is nothing at this address.')).toBeInTheDocument();
  });

  it('should link back to the home screen', () => {
    // When
    render(withProviders(<NotFoundPage />));

    // Then
    expect(screen.getByRole('link', { name: 'Back to the Dex' })).toHaveAttribute('href', '/');
  });
});
