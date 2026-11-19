import { withProviders } from '#platform/frontend/testing';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TabBar } from '../TabBar.tsx';

const renderAt = (path: string) => {
  render(withProviders(<TabBar />, { path }));
  return within(screen.getByRole('navigation', { name: 'Views' }));
};

describe('TabBar', () => {
  it('should link to Today, Plants and Calendar', () => {
    // When
    const tabBar = renderAt('/m/plant-assistant');

    // Then
    expect(tabBar.getByRole('link', { name: 'Today' })).toHaveAttribute(
      'href',
      '/m/plant-assistant/today',
    );

    expect(tabBar.getByRole('link', { name: 'Plants' })).toHaveAttribute(
      'href',
      '/m/plant-assistant',
    );

    expect(tabBar.getByRole('link', { name: 'Calendar' })).toHaveAttribute(
      'href',
      '/m/plant-assistant/calendar',
    );
  });

  it('should mark the current view', () => {
    // When
    const tabBar = renderAt('/m/plant-assistant/calendar');

    // Then
    expect(tabBar.getByRole('link', { name: 'Calendar' })).toHaveAttribute('aria-current', 'page');
    expect(tabBar.getByRole('link', { name: 'Today' })).not.toHaveAttribute('aria-current');
    expect(tabBar.getByRole('link', { name: 'Plants' })).not.toHaveAttribute('aria-current');
  });

  it('should list All plants first, then Today and Calendar', () => {
    // When
    const tabBar = renderAt('/m/plant-assistant');

    // Then
    expect(tabBar.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Plants',
      'Today',
      'Calendar',
    ]);
  });
});
