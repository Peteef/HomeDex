import { act, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it } from 'vitest';
import type { PlantSummary } from '../../../../features/plants/index.ts';
import { EmptyTodayBoard } from '../EmptyTodayBoard.tsx';

const IVY: PlantSummary = {
  id: 3,
  name: "Tangela's ivy",
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-15',
  nextWateringOn: '2026-11-22',
  daysUntil: 2,
  urgency: 'soon',
};

describe('EmptyTodayBoard', () => {
  it('should say nothing needs water and name the next plant', () => {
    // When
    render(<EmptyTodayBoard next={IVY} hasPlants />);

    // Then
    expect(screen.getByRole('status')).toHaveTextContent(
      "Nothing to water today.Next: Tangela's ivy,In 2 days",
    );
  });

  it('should say nothing needs water and point to the plants when there are none', () => {
    // When
    render(<EmptyTodayBoard next={null} hasPlants={false} />);

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('Nothing to water today.');
    expect(screen.getByText('Add your plants on the Plants tab.')).toHaveClass('lg:hidden');
    expect(screen.getByText('Add your plants under All plants.')).toHaveClass('hidden lg:inline');
  });

  it('should show its text in Polish', async () => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    render(<EmptyTodayBoard next={IVY} hasPlants />);

    // Then
    expect(screen.getByRole('status')).toHaveTextContent(/^Dziś nie trzeba nic podlewać\./);
  });
});
