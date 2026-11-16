import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CrashedPage } from '../CrashedPage.tsx';

describe('CrashedPage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should explain the problem and link home when a module crashed', () => {
    // When
    render(
      <MemoryRouter>
        <CrashedPage scope="module" onReload={vi.fn()} />
      </MemoryRouter>,
    );

    // Then
    expect(
      screen.getByRole('heading', { level: 1, name: 'This page hit a problem' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Back to the Dex' })).toHaveAttribute('href', '/');
  });

  it('should explain the problem without a link when the app crashed', () => {
    // When
    render(<CrashedPage scope="app" onReload={vi.fn()} />);

    // Then
    expect(
      screen.getByRole('heading', { level: 1, name: 'HomeDex hit a problem' }),
    ).toBeInTheDocument();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should ask to reload when Reload is pressed', () => {
    // Given
    const onReload = vi.fn();
    render(<CrashedPage scope="app" onReload={onReload} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));

    // Then
    expect(onReload).toHaveBeenCalledOnce();
  });
});
