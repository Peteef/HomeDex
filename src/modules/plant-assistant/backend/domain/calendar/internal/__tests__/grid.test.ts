import { describe, expect, it } from 'vitest';
import { gridOf } from '../grid.ts';

describe('gridOf', () => {
  it('should start on the 1st when the month starts on a Monday', () => {
    // When
    const grid = gridOf('2026-06');

    // Then
    expect(grid[0]).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
      '2026-06-05',
      '2026-06-06',
      '2026-06-07',
    ]);

    expect(grid.at(-1)?.at(-1)).toBe('2026-07-05');
  });

  it('should lead with six days of the month before when it starts on a Sunday', () => {
    // When
    const grid = gridOf('2026-02');

    // Then
    expect(grid[0]).toEqual([
      '2026-01-26',
      '2026-01-27',
      '2026-01-28',
      '2026-01-29',
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
    ]);
  });

  it('should include the 29th of February in a leap year', () => {
    // When
    const grid = gridOf('2028-02');

    // Then
    expect(grid.at(-1)).toEqual([
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
      '2028-03-02',
      '2028-03-03',
      '2028-03-04',
      '2028-03-05',
    ]);
  });

  it('should run from December into January', () => {
    // When
    const grid = gridOf('2026-12');

    // Then
    expect(grid[0]?.[0]).toBe('2026-11-30');
    expect(grid.at(-1)?.at(-1)).toBe('2027-01-03');
  });

  it.each([
    ['2027-02', 4],
    ['2026-06', 5],
    ['2026-08', 6],
  ])('should give %s %i whole weeks', (month, weeks) => {
    // When
    const grid = gridOf(month);

    // Then
    expect(grid).toHaveLength(weeks);
    expect(grid.every((week) => week.length === 7)).toBe(true);
  });
});
