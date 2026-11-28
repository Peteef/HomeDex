import { fakeApi, ok, withProviders } from '#platform/frontend/testing';
import { render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ModuleLayout } from '../ModuleLayout.tsx';
import { stubScreenWidth } from './screenWidth.ts';

const PHONE_WIDTH_REM = 23.4375;
const DESKTOP_WIDTH_REM = 80;

const plantDueIn = (id: number, daysUntil: number) => ({
  id,
  name: `Plant ${String(id)}`,
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-10',
  nextWateringOn: '2026-11-20',
  daysUntil,
  urgency: daysUntil < 0 ? 'overdue' : 'later',
});

const openLayout = () => {
  render(
    withProviders(
      <Routes>
        <Route path="/m/plant-assistant" element={<ModuleLayout />}>
          <Route index element={<p>Page content</p>} />
        </Route>
      </Routes>,
      { path: '/m/plant-assistant' },
    ),
  );
};

describe('ModuleLayout', () => {
  it('should show the page under the title and the tab bar on a phone', () => {
    // Given
    stubScreenWidth(PHONE_WIDTH_REM);

    // When
    openLayout();

    // Then
    expect(screen.getByRole('heading', { level: 1, name: 'Plant Assistant' })).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plants' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'All plants' })).toBeNull();
  });

  it('should show the view tabs above the page on desktop', () => {
    // Given
    stubScreenWidth(DESKTOP_WIDTH_REM);

    // When
    openLayout();

    // Then
    expect(screen.getByText('Page content')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'All plants' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    expect(screen.queryByRole('link', { name: 'Plants' })).toBeNull();
  });

  it('should count the plants due on the Today tab', async () => {
    // Given
    stubScreenWidth(PHONE_WIDTH_REM);

    fakeApi({
      'GET /api/m/plant-assistant/plants': ok({
        today: '2026-11-20',
        plants: [plantDueIn(1, -2), plantDueIn(2, 0), plantDueIn(3, 4)],
      }),
    });

    // When
    openLayout();

    // Then
    expect(
      await screen.findByRole('link', { name: 'Today, 2 plants to water' }),
    ).toBeInTheDocument();
  });
});
