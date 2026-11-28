import { withProviders } from '#platform/frontend/testing';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TabBar } from '../TabBar.tsx';

const renderAt = (path: string, todayCount = 0) => {
  render(withProviders(<TabBar todayCount={todayCount} />, { path }));
  return within(screen.getByRole('navigation', { name: 'Views' }));
};

describe('TabBar', () => {
  it('should link to Plants, Today and Calendar', () => {
    // When
    const tabBar = renderAt('/m/plant-assistant');

    // Then
    expect(tabBar.getByRole('link', { name: 'Plants' })).toHaveAttribute(
      'href',
      '/m/plant-assistant',
    );

    expect(tabBar.getByRole('link', { name: 'Today' })).toHaveAttribute(
      'href',
      '/m/plant-assistant/today',
    );

    expect(tabBar.getByRole('link', { name: 'Calendar' })).toHaveAttribute(
      'href',
      '/m/plant-assistant/calendar',
    );
  });

  it('should list Plants first, then Today and Calendar', () => {
    // When
    const tabBar = renderAt('/m/plant-assistant');

    // Then
    expect(tabBar.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Plants',
      'Today',
      'Calendar',
    ]);
  });

  it('should mark the current view', () => {
    // When
    const tabBar = renderAt('/m/plant-assistant/calendar');

    // Then
    expect(tabBar.getByRole('link', { name: 'Calendar' })).toHaveAttribute('aria-current', 'page');
    expect(tabBar.getByRole('link', { name: 'Plants' })).not.toHaveAttribute('aria-current');
    expect(tabBar.getByRole('link', { name: 'Today' })).not.toHaveAttribute('aria-current');
  });

  it('should show the plants to water on the Today tab while another view is open', () => {
    // When
    const tabBar = renderAt('/m/plant-assistant', 3);

    // Then
    const today = tabBar.getByRole('link', { name: 'Today, 3 plants to water' });
    expect(today).toHaveTextContent('3');
  });

  it('should show no badge on the Today tab while Today is open', () => {
    // When
    const tabBar = renderAt('/m/plant-assistant/today', 3);

    // Then
    expect(tabBar.getByRole('link', { name: 'Today' })).not.toHaveTextContent('3');
  });

  it('should show no badge when no plant is due', () => {
    // When
    const tabBar = renderAt('/m/plant-assistant', 0);

    // Then
    expect(tabBar.getByRole('link', { name: 'Today' })).toHaveTextContent(/^Today$/);
  });
});
