import { describe, expect, it } from 'vitest';
import { projectWaterings } from '../projection.ts';

const FERN = { summerIntervalDays: 7, winterIntervalDays: 30 };

describe('projectWaterings', () => {
  it('should repeat the summer interval from a plant due today', () => {
    // When
    const waterings = projectWaterings(
      { ...FERN, nextWateringOn: '2026-06-03' },
      '2026-06-03',
      '2026-06-30',
    );

    // Then
    expect(waterings).toEqual([
      { date: '2026-06-03', urgency: 'today' },
      { date: '2026-06-10', urgency: 'later' },
      { date: '2026-06-17', urgency: 'later' },
      { date: '2026-06-24', urgency: 'later' },
    ]);
  });

  it('should mark a watering in one or two days as soon', () => {
    // When
    const waterings = projectWaterings(
      { ...FERN, nextWateringOn: '2026-06-05' },
      '2026-06-03',
      '2026-06-11',
    );

    // Then
    expect(waterings).toEqual([{ date: '2026-06-05', urgency: 'soon' }]);
  });

  it('should switch to the winter interval after the first watering in winter', () => {
    // When
    const waterings = projectWaterings(
      { ...FERN, nextWateringOn: '2026-09-28' },
      '2026-09-20',
      '2026-11-08',
    );

    // Then
    expect(waterings).toEqual([
      { date: '2026-09-28', urgency: 'later' },
      { date: '2026-10-05', urgency: 'later' },
      { date: '2026-11-04', urgency: 'later' },
    ]);
  });

  it('should show an overdue plant on today and continue from today', () => {
    // When
    const waterings = projectWaterings(
      { ...FERN, nextWateringOn: '2026-06-01' },
      '2026-06-03',
      '2026-06-17',
    );

    // Then
    expect(waterings).toEqual([
      { date: '2026-06-03', urgency: 'overdue' },
      { date: '2026-06-10', urgency: 'later' },
      { date: '2026-06-17', urgency: 'later' },
    ]);
  });

  it('should project nothing for a plant due after the last day', () => {
    // When / Then
    expect(
      projectWaterings({ ...FERN, nextWateringOn: '2026-07-10' }, '2026-06-03', '2026-07-05'),
    ).toEqual([]);
  });
});
