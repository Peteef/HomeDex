import { render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppLayout } from '../AppLayout.tsx';
import { withProviders } from './helpers.tsx';

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

describe('AppLayout', () => {
  it('should draw the three scene images when a page is shown', () => {
    // When
    const { container } = renderLayout();

    // Then
    const sources = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));

    expect(sources).toEqual([
      '/media/scene/background.svg',
      '/media/scene/sprite-sofa.svg',
      '/media/scene/sprite-table.svg',
    ]);
  });

  it('should show the routed page inside main when the route matches', () => {
    // When
    renderLayout();

    // Then
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { name: 'Hi' }));
  });
});
