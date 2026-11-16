import { fireEvent, render, screen } from '@testing-library/react';
import { lazy } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppBoundary, ModuleBoundary } from '../ErrorBoundaries.tsx';

const Broken = () => {
  throw new Error('boom');
};

const FailedChunk = lazy(() => Promise.reject(new Error('chunk')));

describe('ErrorBoundaries', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ModuleBoundary', () => {
    it("should show the module's page when it renders", () => {
      // When
      render(
        <MemoryRouter>
          <ModuleBoundary>
            <h1>Notes</h1>
          </ModuleBoundary>
        </MemoryRouter>,
      );

      // Then
      expect(screen.getByRole('heading', { level: 1, name: 'Notes' })).toBeInTheDocument();
    });

    it("should show the crash message when the module's page throws", () => {
      // When
      render(
        <MemoryRouter>
          <ModuleBoundary>
            <Broken />
          </ModuleBoundary>
        </MemoryRouter>,
      );

      // Then
      expect(
        screen.getByRole('heading', { level: 1, name: 'This page hit a problem' }),
      ).toBeInTheDocument();
    });

    it("should show the crash message when the module's code fails to load", async () => {
      // When
      render(
        <MemoryRouter>
          <ModuleBoundary>
            <FailedChunk />
          </ModuleBoundary>
        </MemoryRouter>,
      );

      // Then
      expect(
        await screen.findByRole('heading', { level: 1, name: 'This page hit a problem' }),
      ).toBeInTheDocument();
    });
  });

  describe('AppBoundary', () => {
    it('should show the app crash message when anything inside throws', () => {
      // When
      render(
        <AppBoundary>
          <Broken />
        </AppBoundary>,
      );

      // Then
      expect(
        screen.getByRole('heading', { level: 1, name: 'HomeDex hit a problem' }),
      ).toBeInTheDocument();
    });

    it('should reload the page when Reload is pressed', () => {
      // Given
      const reload = vi.fn();
      vi.stubGlobal('location', { reload });

      render(
        <AppBoundary>
          <Broken />
        </AppBoundary>,
      );

      // When
      fireEvent.click(screen.getByRole('button', { name: 'Reload' }));

      // Then
      expect(reload).toHaveBeenCalledOnce();
    });
  });
});
