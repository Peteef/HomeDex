import { act, render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AppLayout } from '../AppLayout.tsx';
import { withProviders } from './helpers.tsx';

const MINUTE_MS = 60 * 1000;

const renderLayout = () =>
  render(
    withProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<h1>Hi</h1>} />
        </Route>
      </Routes>,
    ),
  );

const sceneSources = () =>
  [...document.querySelectorAll('img')].map((image) => image.getAttribute('src'));

describe('AppLayout', () => {
  it('should show the routed page inside main when the route matches', () => {
    // When
    renderLayout();

    // Then
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { name: 'Hi' }));
  });

  it('should switch to the night scene and colours when night falls while the app is open', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 1, 20, 50));
    renderLayout();
    expect(sceneSources()).toEqual(['/media/scene/day/background.webp']);

    // When
    act(() => {
      vi.advanceTimersByTime(10 * MINUTE_MS);
    });

    // Then
    expect(sceneSources()).toEqual(['/media/scene/night/background.webp']);
    expect(document.documentElement).toHaveAttribute('data-time-of-day', 'night');
  });
});
