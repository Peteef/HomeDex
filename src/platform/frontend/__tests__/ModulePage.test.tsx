import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ModulePage } from '../ModulePage.tsx';
import type { ModulePageProps } from '../ModulePage.tsx';

const renderPage = (props: Partial<ModulePageProps> = {}) =>
  render(
    <MemoryRouter initialEntries={['/m/plants']}>
      <ModulePage title="Plants" {...props}>
        <p>Monstera</p>
      </ModulePage>
    </MemoryRouter>,
  );

describe('ModulePage', () => {
  it('should show the title as the page heading', () => {
    // When
    renderPage();

    // Then
    expect(screen.getByRole('heading', { level: 1, name: 'Plants' })).toBeInTheDocument();
  });

  it('should link back to the Dex', () => {
    // When
    renderPage();

    // Then
    expect(screen.getByRole('link', { name: 'Back to the Dex' })).toHaveAttribute('href', '/');
  });

  it('should show its children', () => {
    // When
    renderPage();

    // Then
    expect(screen.getByText('Monstera')).toBeInTheDocument();
  });

  it('should use the regular panel when wide is not set', () => {
    // When
    renderPage();

    // Then
    expect(screen.getByText('Monstera').parentElement).toHaveClass('max-w-3xl');
  });

  it('should use the wide panel when wide is set', () => {
    // When
    renderPage({ wide: true });

    // Then
    expect(screen.getByText('Monstera').parentElement).toHaveClass('max-w-6xl');
  });
});
