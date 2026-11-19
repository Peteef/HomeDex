import { withProviders } from '#platform/frontend/testing';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MainPage } from '../MainPage.tsx';
import { stubScreenWidth } from './screenWidth.ts';

const PHONE_WIDTH_REM = 23.4375;
const DESKTOP_WIDTH_REM = 80;

const viewHeadings = () =>
  screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);

describe('MainPage', () => {
  it('should show the tab bar and only the current view on a phone', () => {
    // Given
    stubScreenWidth(PHONE_WIDTH_REM);

    // When
    render(withProviders(<MainPage view="calendar" />, { path: '/m/plant-assistant/calendar' }));

    // Then
    expect(screen.getByRole('heading', { level: 1, name: 'Plant Assistant' })).toBeInTheDocument();
    expect(viewHeadings()).toEqual(['Upcoming waterings']);
    expect(screen.getByRole('link', { name: 'Today' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'To water today' })).toBeNull();
  });

  it('should show the view tabs and only the current view on desktop', () => {
    // Given
    stubScreenWidth(DESKTOP_WIDTH_REM);

    // When
    render(withProviders(<MainPage view="plants" />, { path: '/m/plant-assistant' }));

    // Then
    expect(viewHeadings()).toEqual(['All plants']);

    expect(screen.getByRole('link', { name: 'All plants' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    expect(screen.queryByRole('link', { name: 'Today' })).toBeNull();
  });

  it('should leave naming the view to its tab on desktop', () => {
    // Given
    stubScreenWidth(DESKTOP_WIDTH_REM);

    // When
    render(withProviders(<MainPage view="today" />, { path: '/m/plant-assistant/today' }));

    // Then
    expect(screen.getByRole('heading', { level: 2, name: 'To water today' })).toHaveClass(
      'sr-only',
    );
  });
});
