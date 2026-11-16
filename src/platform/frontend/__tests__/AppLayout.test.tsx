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
  it('should show the routed page inside main when the route matches', () => {
    // When
    renderLayout();

    // Then
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { name: 'Hi' }));
  });
});
