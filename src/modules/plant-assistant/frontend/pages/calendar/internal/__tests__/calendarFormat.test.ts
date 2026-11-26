import { describe, expect, it } from 'vitest';
import { calendarFormat } from '../calendarFormat.ts';

describe('calendarFormat', () => {
  it('should format in English', () => {
    // When
    const format = calendarFormat('en');

    // Then
    expect(format.monthTitle('2026-11')).toBe('November 2026');
    expect(format.fullDate('2026-11-20')).toBe('Friday, November 20');
    expect(format.weekdayShort('2026-11-16')).toBe('Mon');
    expect(format.weekdayLong('2026-11-16')).toBe('Monday');
    expect(format.dayNumber('2026-11-01')).toBe('1');
  });

  it('should format in Polish', () => {
    // When
    const format = calendarFormat('pl');

    // Then
    expect(format.monthTitle('2026-11')).toBe('listopad 2026');
    expect(format.fullDate('2026-11-20')).toBe('piątek, 20 listopada');
    expect(format.weekdayShort('2026-11-16')).toBe('pon.');
  });
});
