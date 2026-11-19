import { withProviders } from '#platform/frontend/testing';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ViewTabs } from '../ViewTabs.tsx';

describe('ViewTabs', () => {
  it('should link to To water today, All plants and Calendar', () => {
    // When
    render(withProviders(<ViewTabs />, { path: '/m/plant-assistant' }));

    // Then
    expect(screen.getByRole('link', { name: 'To water today' })).toHaveAttribute(
      'href',
      '/m/plant-assistant/today',
    );

    expect(screen.getByRole('link', { name: 'All plants' })).toHaveAttribute(
      'href',
      '/m/plant-assistant',
    );

    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute(
      'href',
      '/m/plant-assistant/calendar',
    );
  });

  it('should mark the current view', () => {
    // When
    render(withProviders(<ViewTabs />, { path: '/m/plant-assistant/today' }));

    // Then
    expect(screen.getByRole('link', { name: 'To water today' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    expect(screen.getByRole('link', { name: 'All plants' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Calendar' })).not.toHaveAttribute('aria-current');
  });

  it('should list All plants first, then Today and Calendar', () => {
    // When
    render(withProviders(<ViewTabs />, { path: '/m/plant-assistant' }));

    // Then
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'All plants',
      'To water today',
      'Calendar',
    ]);
  });
});
