import { withProviders } from '#platform/frontend/testing';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ViewSwitch } from '../ViewSwitch.tsx';

describe('ViewSwitch', () => {
  it('should link to Plants and Calendar', () => {
    // When
    render(withProviders(<ViewSwitch current="plants" />));

    // Then
    expect(screen.getByRole('link', { name: 'Plants' })).toHaveAttribute(
      'href',
      '/m/plant-assistant/plants',
    );

    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute(
      'href',
      '/m/plant-assistant/calendar',
    );
  });

  it('should mark the current view', () => {
    // When
    render(withProviders(<ViewSwitch current="calendar" />));

    // Then
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Plants' })).not.toHaveAttribute('aria-current');
  });
});
