import { withProviders } from '#platform/frontend/testing';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MainPage } from '../MainPage.tsx';
import { stubScreenWidth } from './screenWidth.ts';

const PHONE_WIDTH_REM = 23.4375;
const DESKTOP_WIDTH_REM = 80;

const headingTexts = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

describe('MainPage', () => {
  it('should show the tab bar and only the current view on a phone', () => {
    // Given
    stubScreenWidth(PHONE_WIDTH_REM);

    // When
    render(withProviders(<MainPage view="plants" />, { path: '/m/plant-assistant/plants' }));

    // Then
    expect(screen.getByRole('heading', { level: 1, name: 'Plant Assistant' })).toBeInTheDocument();
    expect(headingTexts()).toEqual(['All plants']);
    expect(screen.getByRole('navigation', { name: 'Views' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Plants or calendar' })).toBeNull();
  });

  it('should show Today beside the plant list on desktop', () => {
    // Given
    stubScreenWidth(DESKTOP_WIDTH_REM);

    // When
    render(withProviders(<MainPage view="today" />, { path: '/m/plant-assistant' }));

    // Then
    expect(headingTexts()).toEqual(['To water today', 'All plants']);
    expect(screen.getByRole('link', { name: 'Plants' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('navigation', { name: 'Views' })).toBeNull();
  });

  it('should show Today beside the calendar on desktop when the view is calendar', () => {
    // Given
    stubScreenWidth(DESKTOP_WIDTH_REM);

    // When
    render(withProviders(<MainPage view="calendar" />, { path: '/m/plant-assistant/calendar' }));

    // Then
    expect(headingTexts()).toEqual(['To water today', 'Upcoming waterings']);
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute('aria-current', 'page');
  });
});
