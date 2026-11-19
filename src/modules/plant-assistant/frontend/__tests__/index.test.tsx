import { withProviders } from '#platform/frontend/testing';
import { render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import PlantAssistant from '../index.tsx';
import { stubScreenWidth } from './screenWidth.ts';

const PHONE_WIDTH_REM = 23.4375;

const openAt = (path: string) => {
  render(
    withProviders(
      <Routes>
        <Route path="/m/plant-assistant/*" element={<PlantAssistant />} />
      </Routes>,
      { path },
    ),
  );
};

const viewHeading = () => screen.getByRole('heading', { level: 2 }).textContent;

describe('plant assistant module page', () => {
  beforeEach(() => {
    stubScreenWidth(PHONE_WIDTH_REM);
  });

  it('should show all plants at the module route', () => {
    // When
    openAt('/m/plant-assistant');

    // Then
    expect(screen.getByRole('heading', { level: 1, name: 'Plant Assistant' })).toBeInTheDocument();
    expect(viewHeading()).toBe('All plants');
  });

  it('should show Today at its route', () => {
    // When
    openAt('/m/plant-assistant/today');

    // Then
    expect(viewHeading()).toBe('To water today');
  });

  it('should show the calendar at its route', () => {
    // When
    openAt('/m/plant-assistant/calendar');

    // Then
    expect(viewHeading()).toBe('Upcoming waterings');
  });

  it('should show all plants when the path is unknown', () => {
    // When
    openAt('/m/plant-assistant/unknown');

    // Then
    expect(viewHeading()).toBe('All plants');
    expect(screen.getByRole('link', { name: 'Plants' })).toHaveAttribute('aria-current', 'page');
  });
});
