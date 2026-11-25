import { act, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it } from 'vitest';
import type { PlantDetails as Plant } from '../../../../features/plants/index.ts';
import { PlantDetails } from '../PlantDetails.tsx';

const FERN: Plant = {
  id: 1,
  name: "Bulbasaur's fern",
  description: 'Likes shade.\nMist on hot days.',
  tags: ['Living room', 'Shade'],
  photoId: null,
  lastWateredOn: '2026-11-16',
  nextWateringOn: '2026-11-23',
  daysUntil: 3,
  urgency: 'later',
  summerIntervalDays: 7,
  winterIntervalDays: 21,
  currentSeason: 'winter',
};

const valueOf = (term: string) => screen.getByText(term).nextElementSibling?.textContent;

describe('PlantDetails', () => {
  it('should show the description with its line breaks', () => {
    // When
    render(<PlantDetails plant={FERN} />);

    // Then
    const description = screen.getByText(/Likes shade/);
    expect(description.textContent).toBe('Likes shade.\nMist on hot days.');
    expect(description).toHaveClass('whitespace-pre-line');
  });

  it('should show the tags', () => {
    // When
    render(<PlantDetails plant={FERN} />);

    // Then
    expect(screen.getByText('Living room')).toBeInTheDocument();
    expect(screen.getByText('Shade')).toBeInTheDocument();
  });

  it('should show both intervals and mark the current season', () => {
    // When
    render(<PlantDetails plant={FERN} />);

    // Then
    expect(valueOf('Summer')).toBe('Every 7 days');
    expect(valueOf('Winter')).toBe('Every 21 daysnow');
  });

  it('should say every day for an interval of one day', () => {
    // When
    render(<PlantDetails plant={{ ...FERN, summerIntervalDays: 1, currentSeason: 'summer' }} />);

    // Then
    expect(valueOf('Summer')).toBe('Every daynow');
  });

  it('should show the last and the next watering with its urgency', () => {
    // When
    render(<PlantDetails plant={FERN} />);

    // Then
    expect(valueOf('Last watered')).toBe('Mon, Nov 16');
    expect(valueOf('Next watering')).toBe('Mon, Nov 23In 3 days');
  });

  it('should leave out the description and tags when the plant has none', () => {
    // When
    render(<PlantDetails plant={{ ...FERN, description: null, tags: [] }} />);

    // Then
    expect(screen.queryByText(/Likes shade/)).not.toBeInTheDocument();
    expect(screen.queryByText('Shade')).not.toBeInTheDocument();
  });

  it('should show its text and dates in Polish', async () => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    render(<PlantDetails plant={FERN} />);

    // Then
    expect(valueOf('Lato')).toBe('Co 7 dni');
    expect(valueOf('Zima')).toBe('Co 21 dniteraz');
    expect(valueOf('Ostatnie podlewanie')).toBe('pon., 16 lis');
    expect(valueOf('Następne podlewanie')).toBe('pon., 23 lisZa 3 dni');
  });
});
