import { withProviders } from '#platform/frontend/testing';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ViewTabs } from '../ViewTabs.tsx';

const renderAt = (path: string, todayCount = 0) => {
  render(withProviders(<ViewTabs todayCount={todayCount} />, { path }));
};

describe('ViewTabs', () => {
  it('should link to All plants, To water today and Calendar', () => {
    // When
    renderAt('/m/plant-assistant');

    // Then
    expect(screen.getByRole('link', { name: 'All plants' })).toHaveAttribute(
      'href',
      '/m/plant-assistant',
    );

    expect(screen.getByRole('link', { name: 'To water today' })).toHaveAttribute(
      'href',
      '/m/plant-assistant/today',
    );

    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute(
      'href',
      '/m/plant-assistant/calendar',
    );
  });

  it('should list All plants first, then To water today and Calendar', () => {
    // When
    renderAt('/m/plant-assistant');

    // Then
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'All plants',
      'To water today',
      'Calendar',
    ]);
  });

  it('should mark the current view', () => {
    // When
    renderAt('/m/plant-assistant/today');

    // Then
    expect(screen.getByRole('link', { name: 'To water today' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    expect(screen.getByRole('link', { name: 'All plants' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Calendar' })).not.toHaveAttribute('aria-current');
  });

  it('should show the plants to water on the Today tab while another view is open', () => {
    // When
    renderAt('/m/plant-assistant/calendar', 1);

    // Then
    expect(
      screen.getByRole('link', { name: 'To water today, 1 plant to water' }),
    ).toBeInTheDocument();
  });

  it('should show no badge on the Today tab while Today is open', () => {
    // When
    renderAt('/m/plant-assistant/today', 2);

    // Then
    expect(screen.getByRole('link', { name: 'To water today' })).toHaveTextContent(
      /^To water today$/,
    );
  });
});
